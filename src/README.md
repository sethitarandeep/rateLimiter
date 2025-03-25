# API Rate Limiter Example

This project implements an API rate limiter utilising Redis and exemplifies the usage.

### Features

- 🛠️ Configurable for different endpoints and user types
- 🔐 Different limits for authenticated vs. unauthenticated users
- 📊 Sliding log algorithm for tracking requests
- 🎯 Temporary overrides for special events
- 📝 Comprehensive rate limit information in headers
- 🧪 Well-tested with Jest
- 🐳 Dockerized for easy setup

## Getting Started

### Prerequisites

- Node.js
- Docker
- Docker Compose

### Installation

1. Clone the repository:
    ```sh
    git clone https://github.com/sethitarandeep/ratelimiter.git
    cd ratelimiter
    ```

2. Install dependencies:
    ```sh
    npm install
    ```

3. Start the services using Docker Compose:
    ```sh
    docker-compose up
    ```  

4. The application will be available at `http://localhost:1212`.


### Run unit tests

1. Run the tests using Jest:
    ```sh
    npm test
    ```

## RateLimitOptions Type

The `RateLimitOptions` type defines the configuration options for the rate limiter:

| Property                       | Type                | Description                                                                 |
|--------------------------------|---------------------|-----------------------------------------------------------------------------|
| `windowMs`                     | `number`            | The time window in milliseconds for which the rate limit is applied.        |
| `limit`                        | `number \| object`  | The maximum number of requests allowed within the time window.              |
|                                |                     | **If an object is provided:**                                               |
| `limit.maxRequests`            | `number`            | The maximum number of requests for unauthenticated users.                   |
| `limit.authenticatedMaxRequests` | `number`          | The maximum number of requests for authenticated users.                     |
| `override`                     | `object`            | An optional override configuration that can be applied based on certain events. |
| `override.windowMs`            | `number`            | The time window in milliseconds for the override.                           |
| `override.limit`               | `number`            | The maximum number of requests allowed within the override time window.     |
| `override.event`               | `string[]`          | An array of events that trigger the override.                               |


## Rate Limit Headers

The rate limiter middleware adds the following headers to the response:

- `X-RateLimit-Limit`: The maximum number of requests allowed within the time window.
- `X-RateLimit-Remaining`: The number of requests remaining within the time window.
- `X-RateLimit-Reset`: The time in milliseconds until the rate limit resets.
