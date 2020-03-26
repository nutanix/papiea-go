FROM python:3.8.2

ENV PYTHONBUFFERED 1

EXPOSE 9000

WORKDIR /home

RUN apt-get update && apt-get upgrade -y \
    && apt-get install -y sudo \
    # Cleanup
    && apt-get clean && rm -rf /var/lib/apt/lists/* /tmp/* /var/tmp/*
RUN echo '%sudo ALL=(ALL) NOPASSWD:ALL' >> /etc/sudoers

RUN pip install --upgrade pip

ENV USER_ID 1000
ENV GROUP_ID 1000

RUN groupadd -g $GROUP_ID -r appgroup && useradd -u $USER_ID -r -g appgroup -G sudo appuser
RUN chown $USER_ID:$GROUP_ID /home

USER appuser

ADD requirements.txt /home/
RUN pip install -r requirements.txt

ADD ./papiea/ /home/
CMD python example.py