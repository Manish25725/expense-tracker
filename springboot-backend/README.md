# Expense Tracker - Spring Boot Backend

This is the Spring Boot backend for the Expense Tracker application. It provides the same REST API as the original Node.js backend, with JWT authentication and MongoDB integration.

## Features

- **JWT Authentication** - Secure token-based authentication
- **MongoDB Integration** - Uses Spring Data MongoDB
- **Angular Integration** - Builds and serves the Angular frontend
- **SPA Routing Support** - Handles client-side routing for Angular

## Prerequisites

- Java 17 or higher
- Maven 3.6+
- MongoDB running on localhost:27017
- Node.js 18+ (for building Angular frontend)

## Project Structure

```
springboot-backend/
├── pom.xml                          # Maven configuration with frontend-maven-plugin
├── src/
│   ├── main/
│   │   ├── java/com/expensetracker/
│   │   │   ├── ExpenseTrackerApplication.java
│   │   │   ├── config/              # Security and MongoDB configuration
│   │   │   ├── controller/          # REST controllers
│   │   │   ├── dto/                 # Data Transfer Objects
│   │   │   ├── exception/           # Exception handling
│   │   │   ├── model/               # MongoDB entities
│   │   │   ├── repository/          # MongoDB repositories
│   │   │   ├── security/            # JWT authentication
│   │   │   └── service/             # Business logic
│   │   └── resources/
│   │       ├── application.properties
│   │       └── static/              # Angular build files (generated)
```

## API Endpoints

### User Endpoints
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/api/v1/users/register` | Register a new user | No |
| POST | `/api/v1/users/login` | Login user | No |
| POST | `/api/v1/users/logout` | Logout user | Yes |
| POST | `/api/v1/users/refresh-token` | Refresh access token | No |
| GET | `/api/v1/users/current-user` | Get current user | Yes |
| DELETE | `/api/v1/users/delete-account` | Delete account | Yes |
| GET | `/api/v1/users/app-version` | Get app version | No |
| PATCH | `/api/v1/users/update-categories` | Update user categories | Yes |
| PATCH | `/api/v1/users/update-profile` | Update user profile | Yes |

### Expense Endpoints
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/v1/expenses` | Get all expenses | Yes |
| POST | `/api/v1/expenses` | Create expense | Yes |
| GET | `/api/v1/expenses/{id}` | Get expense by ID | Yes |
| PATCH | `/api/v1/expenses/{id}` | Update expense | Yes |
| DELETE | `/api/v1/expenses/{id}` | Delete expense | Yes |
| GET | `/api/v1/expenses/stats` | Get expense statistics | Yes |
| POST | `/api/v1/expenses/import` | Import expenses | Yes |
| GET | `/api/v1/expenses/dashboard` | Get dashboard expenses | Yes |

### Health Endpoint
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/v1/health` | Health check | No |

## Building and Running

### Development (Backend only)

```bash
# Skip frontend build during development
cd springboot-backend
mvn spring-boot:run -Pskip-frontend
```

### Full Build (Frontend + Backend)

```bash
# This will:
# 1. Install Node.js and npm
# 2. Run npm install for Angular
# 3. Run npm run build for Angular
# 4. Copy Angular build to src/main/resources/static
# 5. Build Spring Boot JAR

cd springboot-backend
mvn clean package
```

### Run the JAR

```bash
java -jar target/expense-tracker-1.0.0.jar
```

The application will be available at http://localhost:8080

## Configuration

Edit `src/main/resources/application.properties`:

```properties
# MongoDB Connection
spring.data.mongodb.uri=mongodb://localhost:27017/expense-tracker

# JWT Settings
jwt.secret=your-super-secret-key-here
jwt.access-token-expiration=86400000  # 24 hours
jwt.refresh-token-expiration=604800000  # 7 days

# CORS (for development)
app.cors.allowed-origins=http://localhost:4200,http://localhost:8080
```

## Environment Variables

You can override properties using environment variables:

```bash
export SPRING_DATA_MONGODB_URI=mongodb://your-mongodb-server:27017/expense-tracker
export JWT_SECRET=your-production-secret-key
export APP_CORS_ALLOWED_ORIGINS=https://your-domain.com
```

## SPA Routing

The `SpaController` handles Angular client-side routing. It forwards all non-API and non-static file requests to `index.html`, allowing Angular Router to handle the navigation.

## Docker Support (Optional)

Create a `Dockerfile` in the springboot-backend directory:

```dockerfile
FROM eclipse-temurin:17-jdk-alpine as build
WORKDIR /app
COPY . .
RUN ./mvnw clean package -DskipTests

FROM eclipse-temurin:17-jre-alpine
COPY --from=build /app/target/*.jar app.jar
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "/app.jar"]
```

## Migration from Node.js Backend

This Spring Boot backend is a drop-in replacement for the Node.js backend. The API endpoints and response formats are identical, so no changes are needed in the Angular frontend.

### Key Differences:
1. Uses BCrypt for password hashing (compatible with the Node.js bcrypt)
2. Uses JJWT for JWT tokens (compatible token format)
3. Uses Spring Data MongoDB instead of Mongoose
