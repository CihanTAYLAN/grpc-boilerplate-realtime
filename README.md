<div align="center">
<h1>gRPC Boilerplate with Real-time Capabilities</h1>

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![NestJS](https://img.shields.io/badge/NestJS-v11.0.1-red.svg)](https://nestjs.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-v5.7.3-blue.svg)](https://www.typescriptlang.org/)
[![gRPC](https://img.shields.io/badge/gRPC-v1.12.6-orange.svg)](https://grpc.io/)
[![MongoDB](https://img.shields.io/badge/MongoDB-v8.10.1-green.svg)](https://www.mongodb.com/)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](http://makeapullrequest.com)

<p align="center">
  <img src="https://raw.githubusercontent.com/nestjs/docs.nestjs.com/master/src/assets/logo-small.svg" width="120" alt="Nest Logo" />
</p>

A production-ready NestJS boilerplate featuring gRPC integration, real-time capabilities, comprehensive authentication, and extensive documentation. Built with modern TypeScript practices and following industry standards.

[Features](#-features) •
[Technologies](#-technologies) •
[Getting Started](#-getting-started) •
[Documentation](#-documentation) •
[Contributing](#-contributing) •
[Support](#-support--community)

</div>

## ✨ Features

### Core Capabilities

- 🚀 Modern, scalable architecture based on **NestJS**
- 📡 High-performance **gRPC** integration with reflection support
- 🔐 Robust JWT-based authentication system
- 📱 Real-time communication capabilities
- 🗄️ MongoDB integration with real-time replica capabilities

### Developer Experience

- 📚 Comprehensive REST API documentation with Swagger
- 📚 Interactive gRPC documentation
- 🛠️ Full TypeScript support with strict typing
- 🧪 Extensive test coverage setup
- 📝 Handlebars template engine integration

### Additional Features

- 📧 Complete email verification system
- 🔍 Built-in gRPC reflection support
- 🔒 Security best practices implementation
- 📦 Docker support for easy deployment
- 🔄 Continuous Integration ready

## 🔧 Technologies

### Core Infrastructure

- [NestJS](https://nestjs.com/) `v11.0.1` - Progressive Node.js framework for building efficient, scalable applications
- [TypeScript](https://www.typescriptlang.org/) `v5.7.3` - Strongly typed programming language building on JavaScript
- [Node.js](https://nodejs.org/) `v18+` - JavaScript runtime built on Chrome's V8 JavaScript engine

### API & Communication

- [gRPC](https://grpc.io/) `v1.12.6` - High-performance, open-source universal RPC framework
- [Protocol Buffers](https://protobuf.dev/) - Language-agnostic data serialization mechanism
- [Express](https://expressjs.com/) - Fast, unopinionated web framework for Node.js
- [Swagger](https://swagger.io/) `v11.0.4` - API documentation & development toolkit

### Database & Storage

- [MongoDB](https://www.mongodb.com/) `v8.10.1` - Document-based distributed database
- [Mongoose](https://mongoosejs.com/) `v11.0.1` - Elegant MongoDB object modeling

### Security & Authentication

- [JWT](https://jwt.io/) `v11.0.0` - Industry standard for secure authentication
- [bcrypt](https://www.npmjs.com/package/bcrypt) `v5.1.1` - Advanced password hashing

### Communication

- [Nodemailer](https://nodemailer.com/) `v6.10.0` - Robust email sending infrastructure
- [Handlebars](https://handlebarsjs.com/) `v4.7.8` - Powerful template engine

### Development & Testing

- [ESLint](https://eslint.org/) `v9.18.0` - Pluggable JavaScript linting utility
- [Prettier](https://prettier.io/) `v3.4.2` - Opinionated code formatter
- [ts-proto](https://github.com/stephenh/ts-proto) `v2.6.1` - TypeScript Protocol Buffers compiler

## 🚀 Getting Started

### Prerequisites

Before you begin, ensure you have the following installed:

- Node.js `v18` or higher
- Yarn package manager
- MongoDB (configured as a replica set for real-time features)
- Protocol Buffers compiler

### Quick Start

1. **Clone the repository**

```bash
git clone https://github.com/cihantaylan/grpc-boilerplate-realtime.git
cd grpc-boilerplate-realtime
```

2. **Install dependencies**

```bash
yarn install
```

3. **Configure environment**

```bash
cp .env.example .env
```

4. **Set up environment variables**

```env
# Application
APP_URL=http://localhost:8000
REST_PORT=8000
GRPC_PORT=8001

# Database Configuration
MONGODB_URI="mongodb://mongo:mongo@localhost:27017/grpcBoilerplate?authSource=admin"

# Security
API_KEY=your_api_key_here
JWT_SECRET=your_jwt_secret_here
JWT_EXPIRES_IN=999999d
JWT_REFRESH_EXPIRES_IN=999999d
BCRYPT_SECRET=544690f9f77fec673e49ba4fa550414444e6ca1d1db0f4e480dedfb4f03c64cf

# Mail Configuration
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_SECURE=true
MAIL_USER=your_email@gmail.com
MAIL_PASS=your_app_password
MAIL_FROM=your_email@gmail.com
MAIL_FROM_NAME=your_name
```

5. **Generate Protocol Buffer files**

```bash
yarn proto:generate
```

6. **Launch the application**

```bash
yarn start:dev
```

## 📚 Documentation

### API Documentation

- REST API Documentation: `http://localhost:8000/rest-doc`
- gRPC Documentation: `http://localhost:8001/grpc-doc`
- Protocol Buffer Definitions: `src/protos/` directory

<details>
<summary>📸 Documentation Screenshots</summary>

#### REST API Documentation

<div align="center">
  <img src="doc-images/rest-doc.png" alt="REST API Documentation" width="100%" />
</div>

#### gRPC Documentation

<div align="center">
  <img src="doc-images/grpc-doc.png" alt="gRPC Documentation" width="100%" />
</div>

</details>

### Project Structure

```
src/
├── app/                  # Application core
│   ├── api/             # REST API endpoints
│   ├── grpc/            # gRPC services
│   │   ├── public-rpc/  # Public gRPC endpoints
│   │   └── secure-rpc/  # Protected gRPC endpoints
│   └── web/             # Web controllers
├── common/              # Shared utilities
│   └── modules/         # Reusable modules
├── protos/              # Protocol Buffer definitions
├── proto-ts/            # Generated TypeScript interfaces
├── schemas/             # Database schemas
└── views/               # Template views
```

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🤝 Contributing

1. Fork the project
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'feat: Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 💬 Support & Community

- 📫 Author: Cihan TAYLAN
  - Website: [cihantaylan.com](https://cihantaylan.com)
  - GitHub: [@cihantaylan](https://github.com/cihantaylan)
  - LinkedIn: [cihantaylan](https://www.linkedin.com/in/cihantaylan/)

### Issue Reporting

Found a bug or have a feature request? Please open an issue on [GitHub](https://github.com/cihanTAYLAN/grpc-boilerplate-realtime/issues) or reach out on [X](https://x.com/cihantaylan24).

---

<div align="center">
  <sub>Built with ❤️ by Cihan TAYLAN</sub>
  <br>
  ⭐ Don't forget to star this project if you found it helpful!
</div>
