import * as protobuf from 'protobufjs';
import * as path from 'path';
import * as fs from 'fs';

// Proto dosyası tanımlamaları
interface ProtoField {
  name: string;
  type: string;
  id: number;
  rule?: string;
  comment?: string;
  defaultValue?: unknown;
}

interface ProtoMessage {
  name: string;
  fields: ProtoField[];
  comment?: string;
}

interface ProtoEnum {
  name: string;
  values: { [key: string]: number };
  comment?: string;
}

interface ProtoMethod {
  name: string;
  requestType: string;
  responseType: string;
  comment?: string;
  requestStream?: boolean;
  responseStream?: boolean;
}

interface ProtoService {
  name: string;
  methods: ProtoMethod[];
  comment?: string;
}

interface ProtoFile {
  name: string;
  package: string;
  messages: ProtoMessage[];
  enums: ProtoEnum[];
  services: ProtoService[];
}

// Proto yükleme ve işleme fonksiyonu
async function loadProtoFile(filePath: string): Promise<ProtoFile | null> {
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
    console.log(`📦 Processing ${fileName}`);

    const protoFile: ProtoFile = {
      name: fileName,
      package: '',
      messages: [],
      enums: [],
      services: [],
    };

    function processRoot(root: protobuf.Root) {
      for (const [name, object] of Object.entries(root.nested || {})) {
        if (object instanceof protobuf.Namespace) {
          if (protoFile.package === '') {
            protoFile.package = name;
          }
          processNamespace(object, name);
        }
      }
    }

    function processNamespace(ns: protobuf.Namespace, currentPackage: string) {
      for (const [name, object] of Object.entries(ns.nested || {})) {
        const fullName = currentPackage ? `${currentPackage}.${name}` : name;

        if (object instanceof protobuf.Service) {
          console.log(`  📡 Found service: ${fullName}`);
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
          processNamespace(object, fullName);
        }
      }
    }

    processRoot(root);

    return protoFile;
  } catch (error) {
    console.error(
      `❌ Error processing ${path.basename(filePath)}: ${
        error instanceof Error ? error.message : String(error)
      }`,
    );
    return null;
  }
}

// HTML oluşturma fonksiyonu
function generateHTML(protoFiles: ProtoFile[]): string {
  function findMessageSchema(
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
                  ? findMessageSchema(messages, fieldType, depth + 1)
                  : '';
                const fieldTypeName = fieldType.split('.').pop() || '';

                return `
                <tr>
                  <td><code class="field-name">${field.name}</code></td>
                  <td>
                    <code class="field-type${isMessageType ? ' has-nested' : ''}"${isMessageType ? ' onclick="toggleNestedSchema(this)"' : ''}>${fieldTypeName}</code>
                    ${nestedSchema ? `<div class="nested-schema hidden">${nestedSchema}</div>` : ''}
                  </td>
                  <td>${field.rule || ''}</td>
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

  const jsCode = `
    function toggleNestedSchema(element) {
      const nestedSchema = element.parentElement.querySelector('.nested-schema');
      if (nestedSchema) {
        if (nestedSchema.classList.contains('hidden')) {
          nestedSchema.style.display = 'block';
          requestAnimationFrame(() => {
            nestedSchema.classList.remove('hidden');
          });
        } else {
          nestedSchema.classList.add('hidden');
          nestedSchema.addEventListener('transitionend', function handler() {
            if (nestedSchema.classList.contains('hidden')) {
              nestedSchema.style.display = 'none';
            }
            nestedSchema.removeEventListener('transitionend', handler);
          });
        }
        element.classList.toggle('expanded');
      }
    }

    function initializeNavResizer() {
      const container = document.querySelector('.container');
      const nav = document.querySelector('.navigation');
      const resizer = document.createElement('div');
      resizer.className = 'navigation-resizer';
      container.appendChild(resizer);

      let isResizing = false;
      let startX;
      let startWidth;

      function startResizing(e) {
        isResizing = true;
        startX = e.clientX;
        startWidth = parseInt(getComputedStyle(nav).width, 10);
        
        resizer.classList.add('resizing');
        document.body.style.cursor = 'col-resize';
        document.body.style.userSelect = 'none';
        
        document.addEventListener('mousemove', handleResizing);
        document.addEventListener('mouseup', stopResizing);
      }

      function handleResizing(e) {
        if (!isResizing) return;

        const width = startWidth + (e.clientX - startX);
        const minWidth = 200;
        const maxWidth = window.innerWidth * 0.4;
        
        if (width >= minWidth && width <= maxWidth) {
          document.documentElement.style.setProperty('--nav-width', width + 'px');
        }
      }

      function stopResizing() {
        isResizing = false;
        resizer.classList.remove('resizing');
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
        
        document.removeEventListener('mousemove', handleResizing);
        document.removeEventListener('mouseup', stopResizing);
      }

      resizer.addEventListener('mousedown', startResizing);
    }

    function toggleServiceMethods(element, event) {
      if (!element) return;

      const service = element.closest('.nav-service');
      if (!service) return;

      const methods = service.querySelector('.nav-methods');
      if (!methods) return;

      if (event) {
        event.preventDefault();
        event.stopPropagation();
      }

      const isExpanded = service.classList.contains('expanded');
      
      document.querySelectorAll('.nav-service.expanded').forEach(openService => {
        console.log('openService', openService, service);
        if (openService !== service) {
          const openMethods = openService.querySelector('.nav-methods');
          if (openMethods) {
            openService.classList.remove('expanded');
            openMethods.style.opacity = '0';
            setTimeout(() => {
              openMethods.style.display = 'none';
            }, 300);
          }
        }
      });
      
      if (isExpanded) {
        service.classList.remove('expanded');
        methods.style.opacity = '0';
        setTimeout(() => {
          methods.style.display = 'none';
        }, 300);
      } else {
        service.classList.add('expanded');
        methods.style.display = 'block';
        setTimeout(() => {
          methods.style.opacity = '1';
        }, 10);
      }
    }

    function expandServiceFromHash() {
      const hash = window.location.hash;
      console.log('expandServiceFromHash', hash);
      if (!hash) return;

      const targetId = hash.substring(1);
      const methodMatch = targetId.match(/^method-(.*?)-/);
      
      if (methodMatch) {
        const serviceName = methodMatch[1];
        const services = document.querySelectorAll('.nav-service');
        let targetService = null;
        
        services.forEach(service => {
          const link = service.querySelector(\`a[href="#service-\${serviceName}"]\`);
          if (link) {
            targetService = service;
          }
        });
        
        if (targetService) {
          const serviceHeader = targetService.querySelector('.nav-service-header');
          if (serviceHeader) {
            toggleServiceMethods(serviceHeader, null);
            
            setTimeout(() => {
              const methodElement = document.querySelector(hash);
              if (methodElement) {
                methodElement.scrollIntoView({ behavior: 'smooth' });
              }
            }, 300);
          }
        }
      } else if (targetId.startsWith('service-')) {
        const services = document.querySelectorAll('.nav-service');
        let targetService = null;
        
        services.forEach(service => {
          const link = service.querySelector(\`a[href="#\${targetId}"]\`);
          if (link) {
            targetService = service;
          }
        });
        
        if (targetService) {
          const serviceHeader = targetService.querySelector('.nav-service-header');
          if (serviceHeader) {
            toggleServiceMethods(serviceHeader, null);
          }
        }
      }
    }

    function toggleServiceName(element) {
      if (!element) return;

      const serviceName = element.textContent;
      console.log('toggleServiceName', serviceName);
    }

    document.addEventListener('DOMContentLoaded', function() {
      initializeNavResizer();

      const methods = document.querySelectorAll('.method');
      methods.forEach(method => {
        const isRequestStream = method.dataset.requestStream === 'true';
        const isResponseStream = method.dataset.responseStream === 'true';
        const typeSpan = method.querySelector('.method-type');
        
        if (typeSpan) {
          let type = 'Unary';
          if (isRequestStream && isResponseStream) type = 'Bidirectional';
          else if (isRequestStream) type = 'Client Stream';
          else if (isResponseStream) type = 'Server Stream';
          
          if(type === 'Unary') typeSpan.textContent = '⚡ Unary';
          if(type === 'Bidirectional') typeSpan.textContent = '↔ Bidirectional';
          if(type === 'Client Stream') typeSpan.textContent = '↗ Client Stream';
          if(type === 'Server Stream') typeSpan.textContent = '↙ Server Stream';
          typeSpan.className = 'method-type ' + type.toLowerCase().replace(' ', '-');
        }
      });

      expandServiceFromHash();
      window.addEventListener('hashchange', expandServiceFromHash);
    });
  `;

  return `<!DOCTYPE html>
<html>
<head>
  <title>gRPC API Documentation</title>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    :root {
      /* Neon Renkler */
      --neon-blue: #00ffff;
      --neon-green: #39ff14;
      --neon-purple: #bc13fe;
      --neon-pink: #ff1493;
      --neon-yellow: #ffff00;
      --neon-orange: #ff6600;
      
      /* Temel Renkler */
      --od-bg: #1a1b26;
      --od-bg-lighter: #24283b;
      --od-bg-darker: #16161e;
      --od-text: #c0caf5;
      --od-border: #2f334d;
      --nav-width: 380px;
    }

    body {
      margin: 0;
      padding: 0;
      font-family: -apple-system, system-ui, sans-serif;
      background: var(--od-bg);
      color: var(--od-text);
    }

    /* Scroll bar stilleri */
    ::-webkit-scrollbar {
      width: 10px;
      height: 10px;
      background: transparent;
    }

    ::-webkit-scrollbar-track {
      background: var(--od-bg-darker);
      border-radius: 5px;
    }

    ::-webkit-scrollbar-thumb {
      background: var(--od-border);
      border-radius: 5px;
      border: 2px solid var(--od-bg-darker);
    }

    ::-webkit-scrollbar-thumb:hover {
      background: var(--neon-blue);
      box-shadow: 0 0 8px var(--neon-blue);
    }

    .container {
      display: flex;
      min-height: 100vh;
      position: relative;
      overflow-x: hidden;
    }

    .navigation {
      width: var(--nav-width);
      height: 100vh;
      background: var(--od-bg-darker);
      padding: 1rem;
      position: fixed;
      overflow-y: auto;
      overflow-x: hidden;
      transition: width 0.3s ease;
      z-index: 100;
      scrollbar-gutter: stable;
      box-sizing: border-box;
    }

    .navigation-resizer {
      position: fixed;
      left: calc(var(--nav-width) - 2px);
      top: 0;
      width: 12px;
      height: 100vh;
      cursor: col-resize;
      z-index: 150;
      display: flex;
      align-items: center;
      justify-content: center;
      background: transparent;
      transform: translateX(-50%);
    }

    .navigation-resizer::after {
      content: '';
      width: 2px;
      height: 100%;
      background: var(--od-border);
      transition: all 0.2s ease;
      border-radius: 2px;
    }

    .navigation-resizer:hover::after,
    .navigation-resizer.resizing::after {
      width: 4px;
      background: var(--neon-blue);
      box-shadow: 0 0 8px var(--neon-blue);
    }

    .navigation h2 {
      color: var(--neon-blue);
      font-size: 1.2rem;
      margin: 0 0 1rem 0;
      padding-bottom: 0.5rem;
      border-bottom: 1px solid var(--od-border);
    }

    .nav-section {
      margin-bottom: 1.5rem;
    }

    .nav-section h3 {
      color: var(--neon-green);
      font-size: 1rem;
      margin: 0 0 0.5rem 0;
    }

    .nav-group {
      margin-bottom: 2rem;
      background: var(--od-bg);
      padding: 1rem;
      border-radius: 6px;
      border: 1px solid var(--od-border);
    }

    .nav-group h4 {
      color: var(--neon-purple);
      font-size: 0.9rem;
      margin: 0 0 1rem 0;
      padding-bottom: 0.5rem;
      border-bottom: 1px solid var(--od-border);
    }

    .nav-list {
      list-style: none;
      padding: 0;
      margin: 0;
    }

    .nav-list li {
      margin: 0.25rem 0;
    }

    .nav-list a {
      color: var(--od-text);
      text-decoration: none;
      font-size: 0.9rem;
      padding: 0.25rem 0.5rem;
      border-radius: 4px;
      display: block;
      transition: all 0.2s;
    }

    .nav-list a:hover {
      background: rgba(0, 255, 255, 0.1);
      color: var(--neon-blue);
      box-shadow: 0 0 8px rgba(0, 255, 255, 0.2);
    }

    .nav-service {
      position: relative;
      cursor: pointer;
      margin-bottom: 0.5rem;
    }

    .nav-service-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0.25rem 0.5rem;
      border-radius: 4px;
      transition: all 0.2s;
      background: var(--od-bg);
      border: 1px solid var(--od-border);
    }

    .nav-service-header:hover {
      background: rgba(0, 255, 255, 0.1);
      border-color: var(--neon-blue);
    }

    .nav-service-header a {
      color: var(--neon-blue);
      text-decoration: none;
      padding: 0;
    }

    .nav-service-header a:hover {
      background: none;
      box-shadow: none;
    }

    .nav-service-toggle {
      font-size: 0.8rem;
      transition: transform 0.2s;
      color: var(--neon-blue);
      width: 20px;
      height: 20px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 3px;
      background: rgba(0, 255, 255, 0.1);
    }

    .nav-service.expanded .nav-service-toggle {
      transform: rotate(90deg);
      background: rgba(0, 255, 255, 0.2);
    }

    .nav-methods {
      margin: 0.5rem 0 0.5rem 1rem;
      padding-left: 0.75rem;
      border-left: 2px solid var(--od-border);
      display: none;
      opacity: 0;
      transition: all 0.3s ease;
    }

    .nav-service.expanded .nav-methods {
      display: block;
      opacity: 1;
    }

    .nav-method {
      font-size: 0.85rem;
      padding: 0.4rem 0.75rem;
      color: var(--od-text);
      opacity: 0.8;
      text-decoration: none;
      display: flex;
      align-items: center;
      gap: 0.5rem;
      border-radius: 3px;
      margin-bottom: 0.25rem;
      transition: all 0.2s;
    }

    .nav-method:hover {
      opacity: 1;
      color: var(--neon-blue);
      background: rgba(0, 255, 255, 0.05);
    }

    .nav-method-type {
      font-size: 0.7rem;
      padding: 0.15rem 0.3rem;
      border-radius: 2px;
      background: var(--od-bg-darker);
      border: 1px solid var(--od-border);
    }

    .nav-method:hover .nav-method-type {
      border-color: var(--neon-blue);
      background: rgba(0, 255, 255, 0.1);
    }

    .content {
      flex: 1;
      margin-left: calc(var(--nav-width));
      padding: 2rem;
      box-sizing: border-box;
      min-height: 100vh;
      overflow-x: hidden;
    }

    .method-content {
      display: grid;
      grid-template-columns: 1fr ;
      gap: 1rem;
      margin-top: 1rem;
    }

    .method-schema {
      background: var(--od-bg);
      padding: 1rem;
      border-radius: 6px;
      border: 1px solid var(--od-border);
      min-width: 0;
      overflow: visible;
      max-height: none;
    }

    .method h4 {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      margin-bottom: 0.5rem;
    }

    .method-type {
      font-size: 0.8rem;
      padding: 0.25rem 0.5rem;
      border-radius: 3px;
      order: -1;
    }

    .method-type.unary {
      background: rgba(0, 255, 255, 0.1);
      color: var(--neon-blue);
    }

    .method-type.client-stream {
      background: rgba(57, 255, 20, 0.1);
      color: var(--neon-green);
    }

    .method-type.server-stream {
      background: rgba(255, 102, 0, 0.1);
      color: var(--neon-orange);
    }

    .method-type.bidirectional {
      background: rgba(188, 19, 254, 0.1);
      color: var(--neon-purple);
    }

    .field-table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 1rem;
    }

    .field-table th,
    .field-table td {
      padding: 0.5rem;
      text-align: left;
      border-bottom: 1px solid var(--od-border);
    }

    .field-name,
    .field-type,
    .field-rule {
      display: inline-block;
      padding: 0.25rem 0.5rem;
      border-radius: 3px;
    }

    .field-name,
    .field-type{
      background: var(--od-bg-darker);
      border: 1px solid var(--od-border);
    }

    .field-rule{
      list-style: none;
      padding: 0;
      margin: 0;
      display: flex;
      width: min-content;
      flex-wrap: wrap;
      gap: 0.5rem;
    }

    .field-rule-item {
      display: inline-block;
      padding: 0.25rem 0.5rem;
      border-radius: 3px;
      border: 1px solid var(--od-border);
    }

    .field-rule-item-required {
      background: var(--od-bg-darker);
      color: var(--neon-pink);
      border-color: rgba(255, 102, 0, 0.3);
    }

    .field-rule-item-optional {
      background: var(--od-bg-darker);
      color: var(--neon-green);
    }

    .field-name {
      color: var(--neon-blue);
      border-color: rgba(0, 255, 255, 0.3);
    }

    .field-type {
      color: var(--neon-green);
      border-color: rgba(57, 255, 20, 0.3);
    }

    .field-type.has-nested {
      cursor: pointer;
      position: relative;
      padding-right: 1.5rem;
    }

    .field-type.has-nested::after {
      content: '▶';
      position: absolute;
      right: 0.5rem;
      top: 50%;
      transform: translateY(-50%);
      font-size: 0.8rem;
      transition: transform 0.2s ease;
      color: var(--neon-blue);
      text-shadow: 0 0 5px var(--neon-blue);
    }

    .field-type.has-nested.expanded::after {
      transform: translateY(-50%) rotate(90deg);
    }

    .field-type.has-nested:hover::after {
      text-shadow: 0 0 8px var(--neon-blue);
    }

    .description {
      padding: 0.75rem;
      margin: 0.5rem 0;
      background: var(--od-bg-lighter);
      border-left: 3px solid var(--neon-blue);
      border-radius: 0 4px 4px 0;
      color: var(--od-text);
      font-style: italic;
      line-height: 1.4;
    }

    .nested-schema {
      margin-top: 0.5rem;
      padding-left: 1rem;
      border-left: 2px solid var(--od-border);
      overflow: hidden;
      transition: all 0.3s ease;
      opacity: 1;
    }

    .nested-schema.hidden {
      opacity: 0;
      max-height: 0;
      margin-top: 0;
    }

    .stream-badge {
      color: var(--neon-purple);
      font-size: 0.8rem;
      padding: 0.25rem 0.5rem;
      border-radius: 3px;
    }
  </style>
  <script>${jsCode}</script>
</head>
<body>
  <div class="container">
    <div class="navigation">
      <h2>API Documentation</h2>
      ${protoFiles
        .map(
          (file) => `
        <div class="nav-section">
          <h3>${file.name}</h3>
          ${
            file.services.length > 0
              ? `
            <div class="nav-group">
              <h4>Services</h4>
              <ul class="nav-list">
                ${file.services
                  .map(
                    (service) => `
                  <li class="nav-service">
                    <div class="nav-service-header" onclick="toggleServiceMethods(this, event)">
                      <a href="#service-${service.name}" class="nav-service-name">${service.name}</a>
                      <span class="nav-service-toggle">▶</span>
                    </div>
                    <div class="nav-methods">
                      ${service.methods
                        .map(
                          (method) => `
                        <a href="#method-${service.name}-${method.name}" class="nav-method">
                          ${
                            method.requestStream && method.responseStream
                              ? '<span class="nav-method-type">↔</span>'
                              : method.requestStream
                                ? '<span class="nav-method-type">↗</span>'
                                : method.responseStream
                                  ? '<span class="nav-method-type">↙</span>'
                                  : '<span class="nav-method-type">⚡</span>'
                          }
                          ${method.name}
                        </a>
                      `,
                        )
                        .join('')}
                    </div>
                  </li>
                `,
                  )
                  .join('')}
              </ul>
            </div>
          `
              : ''
          }
          ${
            file.messages.length > 0
              ? `
            <div class="nav-group">
              <h4>Messages</h4>
              <ul class="nav-list">
                ${file.messages
                  .map(
                    (message) => `
                  <li><a href="#message-${message.name}">${message.name}</a></li>
                `,
                  )
                  .join('')}
              </ul>
            </div>
          `
              : ''
          }
          ${
            file.enums.length > 0
              ? `
            <div class="nav-group">
              <h4>Enums</h4>
              <ul class="nav-list">
                ${file.enums
                  .map(
                    (enum_) => `
                  <li><a href="#enum-${enum_.name}">${enum_.name}</a></li>
                `,
                  )
                  .join('')}
              </ul>
            </div>
          `
              : ''
          }
        </div>
      `,
        )
        .join('')}
    </div>
    <div class="content">
      ${protoFiles
        .map(
          (file) => `
        <div class="proto-file">
          <h2>${file.name}</h2>
          ${file.services
            .map(
              (service) => `
            <div class="service" id="service-${service.name}">
              <h3>${service.name}</h3>
              ${service.comment ? `<p class="description">${service.comment}</p>` : ''}
              ${service.methods
                .map(
                  (method) => `
                <div class="method" id="method-${service.name}-${method.name}" data-request-stream="${method.requestStream}" data-response-stream="${method.responseStream}">
                  <h4>
                    <span class="method-type"></span>
                    ${method.name}
                  </h4>
                  ${method.comment ? `<p class="description">${method.comment}</p>` : ''}
                  <div class="method-content">
                    <div class="method-schema">
                      <h5>Request: <code>${method.requestType}</code>${method.requestStream ? ' <span class="stream-badge">⚡ stream</span>' : ''}</h5>
                      ${findMessageSchema(file.messages, method.requestType)}
                    </div>
                    <div class="method-schema">
                      <h5>Response: <code>${method.responseType}</code>${method.responseStream ? ' <span class="stream-badge">⚡ stream</span>' : ''}</h5>
                      ${findMessageSchema(file.messages, method.responseType)}
                    </div>
                  </div>
                </div>
              `,
                )
                .join('')}
            </div>
          `,
            )
            .join('')}

          ${file.messages
            .map(
              (message) => `
            <div class="message" id="message-${message.name}">
              <h3>${message.name}</h3>
              ${message.comment ? `<p class="description">${message.comment}</p>` : ''}
              ${findMessageSchema(file.messages, message.name)}
            </div>
          `,
            )
            .join('')}

          ${file.enums
            .map(
              (enum_) => `
            <div class="enum" id="enum-${enum_.name}">
              <h3>${enum_.name}</h3>
              ${enum_.comment ? `<p class="description">${enum_.comment}</p>` : ''}
              <table class="field-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Value</th>
                  </tr>
                </thead>
                <tbody>
                  ${Object.entries(enum_.values)
                    .map(
                      ([key, value]) => `
                    <tr>
                      <td><code class="field-name">${key}</code></td>
                      <td>${value}</td>
                    </tr>
                  `,
                    )
                    .join('')}
                </tbody>
              </table>
            </div>
          `,
            )
            .join('')}
        </div>
      `,
        )
        .join('')}
    </div>
  </div>
</body>
</html>`;
}

// Ana fonksiyon
async function generateDocs(): Promise<void> {
  try {
    const rootDir = process.cwd();
    const protoDir = path.join(rootDir, 'src', 'protos');

    console.log('🔍 Scanning for proto files...');

    const protoFiles = [path.join(protoDir, 'grpcBoilerplate.proto')];

    const processedFiles: ProtoFile[] = [];

    for (const protoFile of protoFiles) {
      if (!fs.existsSync(protoFile)) {
        console.warn(`⚠️  Proto file not found: ${path.basename(protoFile)}`);
        continue;
      }

      const processedFile = await loadProtoFile(protoFile);
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

    if (processedFiles.length === 0) {
      console.error('❌ No proto files were processed successfully.');
      return;
    }

    console.log('\n📊 Summary:');
    processedFiles.forEach((f) => {
      console.log(`  ${f.name}:`, {
        services: `${f.services.length} service(s)`,
        messages: `${f.messages.length} message(s)`,
        enums: `${f.enums.length} enum(s)`,
      });
    });

    const html = generateHTML(processedFiles);
    const docsDir = path.join(rootDir, 'docs');

    if (!fs.existsSync(docsDir)) {
      fs.mkdirSync(docsDir);
    }

    const outputPath = path.join(docsDir, 'api.html');
    fs.writeFileSync(outputPath, html);
    console.log(`\n✨ Documentation generated successfully at: ${outputPath}`);
  } catch (error) {
    if (error instanceof Error) {
      console.error('❌ Error generating documentation:', error.message);
    } else {
      console.error('❌ Error generating documentation:', error);
    }
  }
}
// Scripti çalıştır
generateDocs();
