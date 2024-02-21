# Use a specific Node.js 20.10 image
FROM node:20.10-alpine 

# Create working directory 
WORKDIR /app

# Copy your project files
COPY package*.json ./
COPY ./ ./

# Install dependencies
RUN npm install

# Build your Next.js application
RUN npm run build

# Expose the port Next will use
EXPOSE 3000

# Command to start your application
CMD ["npm", "run", "dev"]
