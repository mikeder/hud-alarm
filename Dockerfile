FROM python

WORKDIR /opt/hud-alarm

COPY . .

RUN pip install tornado markdown

EXPOSE 8001
ENTRYPOINT ["python", "daemon/hud-alarm.py"]