<!-- Start Locally using  -->

<!-- Install dependencies -->

yarn

<!-- Apply database migrations -->

yarn prisma migrate dev

<!-- Generate prisma types -->

yarn prisma generate

<!-- Start server -->

yarn start:dev

<!-- Build project -->

yarn build

<!-- Start build -->

yarn start:prod

<!-- Start using Dockerfile -->

<!-- Build docker image -->

docker build -t app:1 .

<!-- Run container -->

docker run --env-file .env -p 8000:8000 app:1