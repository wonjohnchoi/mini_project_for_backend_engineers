To run this implementation, please do the followings:

    git clone git@github.com:wonjohnchoi/mini_project_for_backend_engineers.git

    cd mini_project_for_backend_engineers/

    npm install

    rabbitmq-server & # do this (or do this without & in another shell)

    celery -A celery_tasks worker --loglevel=info & # do this (or do this without & in another shell)

    tar -xvzf mini_db.tar.gz # this tar.gz contains mongo database that contains prespecified username and password (wonjohn, test)

    mongod --dbpath mini_db & # do this (or do this without & in another shell)

    node server.js

Then, go to http://127.0.0.1:8081/ and login with username: wonjohn, password: test

