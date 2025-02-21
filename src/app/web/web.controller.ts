import { Controller, Get, Render } from '@nestjs/common';
import { WebService, ProtoMessage } from './web.service';
import { ApiExcludeController } from '@nestjs/swagger';

interface DocResponse {
  title: string;
  description: string;
  protoFileName?: string;
  services: Array<{
    name: string;
    comment?: string;
    methods: Array<{
      name: string;
      comment?: string;
      requestType: string;
      responseType: string;
      requestStream?: boolean;
      responseStream?: boolean;
      requestSchema: string;
      responseSchema: string;
    }>;
  }>;
  messages: Array<{
    name: string;
    comment?: string;
    fields: Array<{
      name: string;
      type: string;
      rule?: string;
      comment?: string;
    }>;
    schema: string;
  }>;
}

@Controller()
@ApiExcludeController()
export class WebController {
  constructor(private readonly webService: WebService) {}

  @Get()
  @Render('index')
  getIndex() {
    return {
      title: 'gRPC API',
      description: 'Welcome to gRPC API',
    };
  }

  private findMessageSchema(
    messages: ProtoMessage[],
    typeName: string,
    depth = 0,
  ): string {
    if (!typeName || depth > 6) return '';

    const message = messages.find((m) => {
      const shortName = m.name.split('.').pop() || '';
      const shortTypeName = typeName.split('.').pop() || '';
      return shortName === shortTypeName || m.name === typeName;
    });

    if (!message) return '';

    return `
      <div class="message-schema-content">
        ${message.comment ? `<p class="description">${message.comment}</p>` : ''}
        <table class="field-table">
          <thead>
            <tr>
              <th>Field</th>
              <th>Type</th>
              <th>Rule</th>
              <th>Description</th>
            </tr>
          </thead>
          <tbody>
            ${message.fields
              .map((field) => {
                const fieldType = field.type;
                const isMessageType = messages.some((m) => {
                  const shortName = m.name.split('.').pop() || '';
                  const shortFieldType = fieldType.split('.').pop() || '';
                  return shortName === shortFieldType || m.name === fieldType;
                });

                const nestedSchema = isMessageType
                  ? this.findMessageSchema(messages, fieldType, depth + 1)
                  : '';
                const fieldTypeName = fieldType.split('.').pop() || '';

                return `
                <tr>
                  <td><code class="field-name">${field.name}</code></td>
                  <td>
                    <code class="field-type${isMessageType ? ' has-nested' : ''}"${isMessageType ? ' onclick="toggleNestedSchema(this)"' : ''}>${fieldTypeName}</code>
                    ${nestedSchema ? `<div class="nested-schema hidden">${nestedSchema}</div>` : ''}
                  </td>
                  <td>
                    ${
                      field.rule
                        ? field.rule
                            ?.split(',')
                            .map(
                              (rule) =>
                                `<span class="field-rule-item field-rule-item-${rule}">${rule}</span>`,
                            )
                            .join('')
                        : '-'
                    }
                  </td>
                  <td>${field.comment ? `<div class="description">${field.comment}</div>` : ''}</td>
                </tr>
              `;
              })
              .join('')}
          </tbody>
        </table>
      </div>
    `;
  }

  @Get('grpc-doc')
  @Render('grpc-doc')
  async getDoc(): Promise<DocResponse> {
    try {
      const services = await this.webService.getApiServices();
      const firstProtoFile = services[0];

      return {
        title: 'API Documentation',
        description: 'API documentation page',
        protoFileName: firstProtoFile?.name,
        services:
          firstProtoFile?.services.map((service) => ({
            ...service,
            methods: service.methods.map((method) => ({
              ...method,
              requestSchema: this.findMessageSchema(
                firstProtoFile.messages,
                method.requestType,
              ),
              responseSchema: this.findMessageSchema(
                firstProtoFile.messages,
                method.responseType,
              ),
            })),
          })) ?? [],
        messages:
          firstProtoFile?.messages.map((message) => ({
            ...message,
            fields: message.fields.map((field) => ({
              ...field,
              type: field.type.split('.').pop() || '',
            })),
            schema: this.findMessageSchema(
              firstProtoFile.messages,
              message.name,
            ),
          })) ?? [],
      };
    } catch {
      return {
        title: 'API Documentation',
        description: 'Error loading API documentation',
        services: [],
        messages: [],
      };
    }
  }

  @Get('rest-doc')
  getRestDoc() {
    return `<!doctype html>
      <html lang="en">
      <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no">
          <title>Rest API Documentation</title>
        	<link rel="stylesheet" href="/doc/stoplight.min.css"/>
          <script src="/doc/stoplight.min.js"></script>
          <script src="/doc/jquery.min.js"></script>
          <script src="/doc/sl-search.js"></script>
          <link rel="icon" href="/favicon.png" type="image/x-icon">

          <style>
              .sl-h-full{
                  min-height: 100vh !important;
              }
          </style>
      </head>
      <body>
          <elements-api data-theme="dark" apiDescriptionUrl="/swagger-doc-json" router="hash" />
        </body>
      </html>
    `;
  }
}
