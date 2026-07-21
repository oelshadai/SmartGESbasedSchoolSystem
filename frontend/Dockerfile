FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install
RUN npm install -g http-server

# Copy project files
COPY . .

# Accept build arguments for API URLs
ARG VITE_API_BASE_URL
ARG VITE_API_URL
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL
ENV VITE_API_URL=${VITE_API_URL:-$VITE_API_BASE_URL}

# Build the app with environment variables
RUN npm run build

# Expose port
EXPOSE 4173

# Start the app with a static server on Railway's dynamic port
CMD ["sh", "-c", "PORT=${PORT:-4173} && http-server dist -a 0.0.0.0 -p $PORT"]
