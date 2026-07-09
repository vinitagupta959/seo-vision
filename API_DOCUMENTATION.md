# SEO Vision - API Route Documentation

This document describes all API endpoints exposed by the SEO Vision backend application. All API paths are prefixed with `/api`.

---

## 🔑 Authentication Routes

### 1. Register User
*   **URL**: `/api/auth/register`
*   **Method**: `POST`
*   **Description**: Registers a new user account and returns an access token.
*   **Auth Required**: No (Public)
*   **Request Body**:
    ```json
    {
      "name": "Alex Mercer",
      "email": "alex.mercer@seovision.com",
      "password": "password123"
    }
    ```
*   **Success Response**:
    *   **Status Code**: `201 Created`
    *   **Body**:
        ```json
        {
          "status": "success",
          "token": "eyJhbGciOiJIUzI1NiIsIn...",
          "data": {
            "user": {
              "_id": "6a4f41a502e60d8402efebcc",
              "name": "Alex Mercer",
              "email": "alex.mercer@seovision.com",
              "avatar": "",
              "createdAt": "2026-07-09T06:37:10.522Z"
            }
          }
        }
        ```
*   **Error Responses**:
    *   `400 Bad Request`: Email already registered or invalid passwords.

---

### 2. User Login
*   **URL**: `/api/auth/login`
*   **Method**: `POST`
*   **Description**: Authenticates user credentials and issues a JWT token.
*   **Auth Required**: No (Public)
*   **Request Body**:
    ```json
    {
      "email": "alex.mercer@seovision.com",
      "password": "password123"
    }
    ```
*   **Success Response**:
    *   **Status Code**: `200 OK`
    *   **Body**:
        ```json
        {
          "status": "success",
          "token": "eyJhbGciOiJIUzI1NiIsIn...",
          "data": {
            "user": {
              "_id": "6a4f41a502e60d8402efebcc",
              "name": "Alex Mercer",
              "email": "alex.mercer@seovision.com",
              "avatar": "",
              "createdAt": "2026-07-09T06:37:10.522Z"
            }
          }
        }
        ```
*   **Error Responses**:
    *   `401 Unauthorized`: Invalid email or password.

---

### 3. Fetch Profile
*   **URL**: `/api/auth/profile`
*   **Method**: `GET`
*   **Description**: Retrieves details of the currently authenticated user.
*   **Auth Required**: Yes (Bearer Token)
*   **Headers**:
    *   `Authorization: Bearer <jwt_token>`
*   **Success Response**:
    *   **Status Code**: `200 OK`
    *   **Body**:
        ```json
        {
          "status": "success",
          "data": {
            "user": {
              "_id": "6a4f41a502e60d8402efebcc",
              "name": "Alex Mercer",
              "email": "alex.mercer@seovision.com",
              "avatar": "",
              "createdAt": "2026-07-09T06:37:10.522Z"
            }
          }
        }
        ```

---

### 4. Update Profile
*   **URL**: `/api/auth/profile`
*   **Method**: `PUT`
*   **Description**: Updates user credentials or passwords.
*   **Auth Required**: Yes (Bearer Token)
*   **Headers**:
    *   `Authorization: Bearer <jwt_token>`
*   **Request Body**: *(All fields optional)*
    ```json
    {
      "name": "Alex Mercer Updated",
      "email": "alex.new@seovision.com",
      "password": "newpassword123"
    }
    ```
*   **Success Response**:
    *   **Status Code**: `200 OK`
    *   **Body**:
        ```json
        {
          "status": "success",
          "data": {
            "user": {
              "_id": "6a4f41a502e60d8402efebcc",
              "name": "Alex Mercer Updated",
              "email": "alex.new@seovision.com",
              "avatar": "",
              "createdAt": "2026-07-09T06:37:10.522Z"
            }
          }
        }
        ```

---

## 🔍 Analysis Routes

### 5. Run Website Audit
*   **URL**: `/api/analyze`
*   **Method**: `POST`
*   **Description**: Initiates crawler pipeline and scores the website.
*   **Auth Required**: Yes (Bearer Token)
*   **Headers**:
    *   `Authorization: Bearer <jwt_token>`
*   **Request Body**:
    ```json
    {
      "url": "https://example.com"
    }
    ```
*   **Success Response**:
    *   **Status Code**: `201 Created`
    *   **Body**:
        ```json
        {
          "status": "success",
          "data": {
            "analysis": {
              "_id": "6a4f41a502e60d8402efebcd",
              "userId": "6a4f41a502e60d8402efebcc",
              "url": "https://example.com",
              "status": "completed",
              "startedAt": "2026-07-09T06:37:15.100Z",
              "completedAt": "2026-07-09T06:37:22.345Z",
              "reportId": "6a4f41a502e60d8402efebee"
            },
            "report": {
              "_id": "6a4f41a502e60d8402efebee",
              "analysisId": "6a4f41a502e60d8402efebcd",
              "seoScore": 85,
              "basicSeoScore": 90,
              "technicalScore": 80,
              "performanceScore": 85,
              "contentScore": 88,
              "imagesScore": 92,
              "linksScore": 75,
              "structuredDataScore": 90,
              "recommendations": [
                {
                  "title": "Add Alt attributes to images",
                  "priority": "high",
                  "description": "Scraped 3 images without alt tags...",
                  "fix": "Add alt=\"your-description\" to images."
                }
              ]
            }
          }
        }
        ```

---

### 6. Retrieve History
*   **URL**: `/api/analyze/history`
*   **Method**: `GET`
*   **Description**: Retrieves paginated and filtered list of user audits.
*   **Auth Required**: Yes (Bearer Token)
*   **Headers**:
    *   `Authorization: Bearer <jwt_token>`
*   **Query Parameters**:
    - `page` (optional, default: `1`)
    - `limit` (optional, default: `10`)
    - `search` / `keyword` (optional URL search filters)
    - `status` (optional, filter by: `completed`, `failed`, `running`)
    - `sort` (optional, sort by: `newest`, `oldest`, `score_desc`, `score_asc`)
*   **Success Response**:
    *   **Status Code**: `200 OK`
    *   **Body**:
        ```json
        {
          "status": "success",
          "results": 1,
          "totalPages": 1,
          "currentPage": 1,
          "totalResults": 1,
          "data": {
            "analyses": [
              {
                "_id": "6a4f41a502e60d8402efebcd",
                "userId": "6a4f41a502e60d8402efebcc",
                "url": "https://example.com",
                "status": "completed",
                "startedAt": "2026-07-09T06:37:15.100Z",
                "completedAt": "2026-07-09T06:37:22.345Z",
                "reportId": {
                  "_id": "6a4f41a502e60d8402efebee",
                  "seoScore": 85,
                  "basicSeoScore": 90,
                  "technicalScore": 80,
                  "performanceScore": 85,
                  "contentScore": 88,
                  "imagesScore": 92,
                  "linksScore": 75,
                  "structuredDataScore": 90
                }
              }
            ]
          }
        }
        ```

---

### 7. Retrieve Single Analysis
*   **URL**: `/api/analyze/:id`
*   **Method**: `GET`
*   **Description**: Fetches detailed state of one scan and its populated report details.
*   **Auth Required**: Yes (Bearer Token)
*   **Headers**:
    *   `Authorization: Bearer <jwt_token>`
*   **Success Response**:
    *   **Status Code**: `200 OK`
    *   **Body**:
        ```json
        {
          "status": "success",
          "data": {
            "analysis": {
              "_id": "6a4f41a502e60d8402efebcd",
              "userId": "6a4f41a502e60d8402efebcc",
              "url": "https://example.com",
              "status": "completed",
              "startedAt": "2026-07-09T06:37:15.100Z",
              "reportId": {
                "_id": "6a4f41a502e60d8402efebee",
                "seoScore": 85,
                "basicSeoScore": 90,
                "technicalScore": 80,
                "performanceScore": 85,
                "contentScore": 88,
                "imagesScore": 92,
                "linksScore": 75,
                "structuredDataScore": 90,
                "recommendations": [...]
              }
            }
          }
        }
        ```

---

### 8. Delete Audit
*   **URL**: `/api/analyze/:id`
*   **Method**: `DELETE`
*   **Description**: Deletes audit history along with its referenced report scores.
*   **Auth Required**: Yes (Bearer Token)
*   **Headers**:
    *   `Authorization: Bearer <jwt_token>`
*   **Success Response**:
    *   **Status Code**: `204 No Content`
    *   **Body**: *(Empty)*

---

## 📊 Report Routes

### 9. Fetch Report JSON
*   **URL**: `/api/report/:id`
*   **Method**: `GET`
*   **Description**: Retrieves scores and raw scraped elements by analysisId or reportId.
*   **Auth Required**: Yes (Bearer Token)
*   **Headers**:
    *   `Authorization: Bearer <jwt_token>`
*   **Success Response**:
    *   **Status Code**: `200 OK`
    *   **Body**:
        ```json
        {
          "status": "success",
          "data": {
            "report": {
              "_id": "6a4f41a502e60d8402efebee",
              "analysisId": "6a4f41a502e60d8402efebcd",
              "seoScore": 85,
              "reportData": {
                "title": "Example Domain",
                "metaDescription": "Example page meta description...",
                "h1s": ["Example Domain"],
                "imagesCount": 1,
                "brokenImages": [],
                "links": [...]
              }
            }
          }
        }
        ```

---

### 10. Download Report PDF
*   **URL**: `/api/report/download/:id`
*   **Method**: `GET`
*   **Description**: Renders static HTML layouts and streams PDF binaries.
*   **Auth Required**: Yes (Bearer Token)
*   **Headers**:
    *   `Authorization: Bearer <jwt_token>`
*   **Success Response**:
    *   **Status Code**: `200 OK`
    *   **Content-Type**: `application/pdf`
    *   **Body**: *(Binary Stream of A4 PDF Document)*
