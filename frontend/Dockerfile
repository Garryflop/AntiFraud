FROM node:20-slim

WORKDIR /app

# Install dependencies first for better caching
COPY package*.json ./
RUN npm install --legacy-peer-deps

# Copy source files
COPY . .

# Expose port 5173
EXPOSE 5173

# Start development server with host configuration
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]
