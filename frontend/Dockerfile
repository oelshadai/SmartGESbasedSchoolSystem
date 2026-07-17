FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy project files
COPY . .

# Accept build argument for API URL
ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL

# Build the app with environment variable
RUN npm run build

# Expose port
EXPOSE 4173

# Start the app with vite preview
CMD ["npm", "run", "preview", "--", "--host", "0.0.0.0", "--port", "4173"]
