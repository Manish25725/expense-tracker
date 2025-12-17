# Expense Tracker - Full Stack (Spring Boot + Angular)

This project packages the Angular frontend and Spring Boot backend into a single deployable JAR.

## 📁 Project Structure

```
expense-tracker/                    <-- ROOT (Spring Boot Project)
│
├── pom.xml                         <-- Maven config (builds everything)
├── mvnw / mvnw.cmd                 <-- Maven Wrapper
│
├── src/                            <-- BACKEND (Spring Boot/Java)
│   └── main/
│       ├── java/com/expensetracker/
│       │   ├── ExpenseTrackerApplication.java
│       │   ├── config/             <-- Security, CORS, MongoDB config
│       │   ├── controller/         <-- REST API + SPA Controller
│       │   ├── dto/                <-- Request/Response objects
│       │   ├── exception/          <-- Error handling
│       │   ├── model/              <-- MongoDB entities
│       │   ├── repository/         <-- Data access
│       │   ├── security/           <-- JWT authentication
│       │   └── service/            <-- Business logic
│       └── resources/
│           ├── application.properties
│           └── static/             <-- Angular build lands here
│
├── frontend/                       <-- FRONTEND (Angular Project)
│   ├── angular.json
│   ├── package.json
│   └── src/
│
└── target/                         <-- BUILD OUTPUT
    └── expense-tracker-1.0.0.jar   <-- Single deployable JAR
```

## Prerequisites

- Java 17 or higher
- Maven 3.6+ (or use included wrapper)
- MongoDB running on localhost:27017
- Node.js 18+ (Maven installs it automatically)

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

### Full Build (Frontend + Backend)

```bash
# Build everything into a single JAR
./mvnw clean package

# Run the application
java -jar target/expense-tracker-1.0.0.jar
```

The application will be available at **http://localhost:8080**

### Development (Backend only)

```bash
# Skip frontend build during development
./mvnw spring-boot:run -Pskip-frontend

# In a separate terminal, run Angular dev server
cd frontend
npm install
npm start
# Angular runs at http://localhost:4200
```

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
