from celery import Celery

app = Celery('celery_tasks', backend='amqp', broker='amqp://guest:guest@localhost:5672//')
app.config_from_object('celeryconfig')

@app.task(serializer="json")
def concat_string(str1, str2):
    return str1 + str2
