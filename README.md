This is my implementation of Solidware Mini Project for Back-End engineer candidates.

I was given three weeks to implement system specified in mini-project-for-backend-SE.pdf

To run this implementation, please do the followings:

    git clone git@github.com:wonjohnchoi/solidware_mini_project_for_backend_engineers.git

    cd solidware_mini_project_for_backend_engineers/

    npm install

    rabbitmq-server &

    celery -A celery_tasks worker --loglevel=info &

    tar -xvzf solidware_mini_db.tar.gz

    mongod --dbpath solidware_mini_db &

    node server.js

Then, go to http://127.0.0.1:8081/ and login with username: wonjohn, password: test
