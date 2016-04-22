To run this implementation, please do the followings:

    git clone git@github.com:wonjohnchoi/mini_project_for_backend_engineers.git

    cd mini_project_for_backend_engineers/

    npm install

    rabbitmq-server & # this runs rabbitmq server in background or run this in a separate shell without & to monitor its output

    celery -A celery_tasks worker --loglevel=info & # this runs stringconcat celery worker in background or run this in a separate shell without & to monitor its output

    tar -xvzf mini_db.tar.gz # this tar.gz contains mongo database that contains prespecified username and password (wonjohn, test)

    mongod --dbpath mini_db & # this runs mongodb in background or run this in a separate shell without & to monitor its output

    node server.js

Then, go to http://127.0.0.1:8081/ and login with username: wonjohn, password: test

