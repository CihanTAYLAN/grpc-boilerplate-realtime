import { Injectable } from '@nestjs/common';
import * as protobuf from 'protobufjs';
import * as path from 'path';
import * as fs from 'fs';

export interface ProtoField {
  name: string;
  type: string;
  id: number;
  rule?: string;
  comment?: string;
  defaultValue?: unknown;
}

export interface ProtoMessage {
  name: string;
  fields: ProtoField[];
  comment?: string;
}

export interface ProtoEnum {
  name: string;
  values: { [key: string]: number };
  comment?: string;
}

export interface ProtoMethod {
  name: string;
  requestType: string;
  responseType: string;
  comment?: string;
  requestStream?: boolean;
  responseStream?: boolean;
}

export interface ProtoService {
  name: string;
  methods: ProtoMethod[];
  comment?: string;
}

export interface ProtoFile {
  name: string;
  package: string;
  messages: ProtoMessage[];
  enums: ProtoEnum[];
  services: ProtoService[];
}

@Injectable()
export class WebService {
  constructor() {}

  async getApiServices(): Promise<ProtoFile[]> {
    try {
      const rootDir = process.cwd();
      const protoDir = path.join(rootDir, 'src', 'protos');
      const protoFiles = [path.join(protoDir, 'grpcBoilerplate.proto')];
      const processedFiles: ProtoFile[] = [];

      for (const protoFile of protoFiles) {
        if (!fs.existsSync(protoFile)) {
          console.warn(`⚠️  Proto file not found: ${path.basename(protoFile)}`);
          continue;
        }

        const processedFile = await this.loadProtoFile(protoFile);
        if (!processedFile) {
          console.error(`❌ Failed to load ${path.basename(protoFile)}`);
          continue;
        }

        if (
          processedFile.services.length === 0 &&
          processedFile.messages.length === 0 &&
          processedFile.enums.length === 0
        ) {
          console.warn(`⚠️  No content found in ${processedFile.name}`);
          continue;
        }

        processedFiles.push(processedFile);
      }

      return processedFiles;
    } catch (error) {
      console.error('Error loading proto files:', error);
      return [];
    }
  }

  private async loadProtoFile(filePath: string): Promise<ProtoFile | null> {
    try {
      const root = new protobuf.Root();
      const protoDir = path.dirname(filePath);

      root.resolvePath = (origin: string, target: string) => {
        if (path.isAbsolute(target)) {
          return target;
        }
        return path.resolve(protoDir, target);
      };

      await root.load(filePath, { keepCase: true });
      root.resolveAll();

      const fileName = path.basename(filePath);
      const protoFile: ProtoFile = {
        name: fileName,
        package: '',
        messages: [],
        enums: [],
        services: [],
      };

      this.processRoot(root, protoFile);

      return protoFile;
    } catch (error) {
      console.error(
        `Error processing ${path.basename(filePath)}:`,
        error instanceof Error ? error.message : String(error),
      );
      return null;
    }
  }

  private processRoot(root: protobuf.Root, protoFile: ProtoFile): void {
    for (const [name, object] of Object.entries(root.nested || {})) {
      if (object instanceof protobuf.Namespace) {
        if (protoFile.package === '') {
          protoFile.package = name;
        }
        this.processNamespace(object, name, protoFile);
        protoFile.services.sort((a, b) => a.name.localeCompare(b.name));
        protoFile.messages.sort((a, b) => a.name.localeCompare(b.name));
        protoFile.enums.sort((a, b) => a.name.localeCompare(b.name));
      }
    }
  }

  private processNamespace(
    ns: protobuf.Namespace,
    currentPackage: string,
    protoFile: ProtoFile,
  ): void {
    for (const [name, object] of Object.entries(ns.nested || {})) {
      const fullName = currentPackage ? `${currentPackage}.${name}` : name;

      if (object instanceof protobuf.Service) {
        const service: ProtoService = {
          name: fullName,
          methods: [],
          comment: object.comment || undefined,
        };

        for (const [methodName, method] of Object.entries(object.methods)) {
          service.methods.push({
            name: methodName,
            requestType: method.requestType,
            responseType: method.responseType,
            comment: method.comment || undefined,
            requestStream: method.requestStream || false,
            responseStream: method.responseStream || false,
          });
        }

        protoFile.services.push(service);
      } else if (object instanceof protobuf.Type) {
        const message: ProtoMessage = {
          name: fullName,
          fields: [],
          comment: object.comment || undefined,
        };

        for (const field of Object.values(object.fields)) {
          const protoField = field as protobuf.Field & { rule?: string };
          const fieldType = protoField.resolvedType
            ? protoField.resolvedType.fullName.replace(
                `${protoFile.package}.`,
                '',
              )
            : protoField.type;

          const rules: string[] = [];

          const isRequired =
            protoField.comment?.toLowerCase().includes('required') || false;

          if (isRequired) {
            rules.push('required');
          }

          const isOptional =
            protoField.comment?.toLowerCase().includes('optional') || false;

          if (isOptional) {
            rules.push('optional');
          }

          message.fields.push({
            name: protoField.name,
            type: fieldType,
            id: protoField.id,
            rule: rules.join(', '),
            comment: protoField.comment || undefined,
            defaultValue: protoField.defaultValue,
          });
        }

        message.fields.sort((a, b) => a.id - b.id);
        protoFile.messages.push(message);
      } else if (object instanceof protobuf.Enum) {
        protoFile.enums.push({
          name: fullName,
          values: object.values as { [key: string]: number },
          comment: object.comment || undefined,
        });
      } else if (object instanceof protobuf.Namespace) {
        this.processNamespace(object, fullName, protoFile);
      }
    }
  }
}
