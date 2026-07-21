FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

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

# Start the app with vite preview listening on Railway's dynamic port
CMD ["sh", "-c", "vite preview --host 0.0.0.0 --port ${PORT:-4173}"]
