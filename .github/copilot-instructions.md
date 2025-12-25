# Copilot Instructions for the Social_on_JS Project

## Project Overview
This project is a social networking platform built using the NestJS framework. It includes a backend API, real-time communication features, and a frontend rendered with HTML templates and JavaScript. The project is structured to support modular development, with clear separation of concerns across services, modules, and components.

### Key Components
- **Backend**: Built with NestJS, the backend is organized into modules under `src/modules`. Each module encapsulates a specific domain (e.g., `auth`, `profile`, `friends`). The backend also integrates with Prisma for database management and Redis for caching.
- **Frontend**: Static HTML templates are located in the `templates/` directory, with corresponding JavaScript files in `static/js/`.
- **Database**: Managed using Prisma, with migrations stored in `prisma/migrations/`.
- **Real-Time Communication**: Implemented using WebSockets, with the gateway logic in `src/common/gateways/`.

## Developer Workflows

### Building and Running the Project
1. **Install Dependencies**:
   ```bash
   npm install
   ```
2. **Run the Development Server**:
   ```bash
   npm run start:dev
   ```
3. **Build for Production**:
   ```bash
   npm run build
   ```

### Database Migrations
- To generate a new migration:
  ```bash
  npx prisma migrate dev --name <migration_name>
  ```
- To apply migrations:
  ```bash
  npx prisma migrate deploy
  ```

### Testing
- Run tests:
  ```bash
  npm run test
  ```
- Run end-to-end tests:
  ```bash
  npm run test:e2e
  ```

### Debugging
- Use the `src/main.ts` file to set breakpoints for debugging.
- Logs are managed using NestJS's built-in logging service.

## Project-Specific Conventions

### Code Organization
- **Modules**: Each module in `src/modules` should have its own controller, service, and DTO files.
- **Decorators**: Custom decorators (e.g., `@CurrentUser`) are stored in `src/common/decorators/`.
- **Interceptors**: Shared interceptors are located in `src/common/interceptors/`.

### Communication Patterns
- **Kafka**: Used for asynchronous messaging, with logic in `src/common/kafka/`.
- **WebSockets**: Real-time communication is handled in `src/common/gateways/`.

### External Dependencies
- **Prisma**: ORM for database interactions. The schema is defined in `prisma/schema.prisma`.
- **Redis**: Used for caching, with services defined in `src/common/redis/`.

## Examples

### Adding a New Module
1. Create a new directory under `src/modules`.
2. Add `module.ts`, `controller.ts`, `service.ts`, and `dto.ts` files.
3. Register the module in `src/app.module.ts`.

### Creating a New API Endpoint
1. Define the route in the appropriate `controller.ts` file.
2. Implement the business logic in the corresponding `service.ts` file.
3. Validate request data using DTOs.

### Writing a Migration
1. Modify the Prisma schema in `prisma/schema.prisma`.
2. Run:
   ```bash
   npx prisma migrate dev --name <migration_name>
   ```

## Notes
- Follow the existing patterns in the codebase to maintain consistency.
- Use meaningful commit messages to describe changes.
- Refer to the `README.md` file for additional setup instructions.