# Username and password authentication template for Next 14

## Youtube tutorial - username, password authentication
https://www.youtube.com/watch?v=JIIy7VkiTqU

## Youtube tutorial - email, password with email verification

https://www.youtube.com/watch?v=2sHsP_8YLHA&t=1s

- Next 14
- Lucia Auth Package
- Postgre SQL
- Drizzle ORM
- Typescript
- Tailwind CSS
- Shadcn UI

## Installation

install the package using npm or yarn

```bash
npm install
```

or

```bash
yarn
```

## Usage

```bash
npm run dev
```

or

```bash
yarn dev
```

or you can use Docker-compose

```bash
docker-compose up
```

It will start the server on http://localhost:3000 and create a local postgres database on port 5432

## Database
You can create a local postgres database and add the credentials to the .env file

```bash
docker run --name postgres -e POSTGRES_PASSWORD=password -e POSTGRES_USER=username -e POSTGRES_DB=dbname -p 5432:5432 -d postgres
```

```bash
DATABASE_URL=postgres://username:password@localhost:5432/dbname
```

## License

[MIT](https://choosealicense.com/licenses/mit/)
