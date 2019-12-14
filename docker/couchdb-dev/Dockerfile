FROM couchdb:2

ENV INTERNAL_PORT=5984

COPY ./bootstrap_dbs.sh /bootstrap_dbs.sh
COPY ./proxy_auth.ini /opt/couchdb/etc/local.d/proxy_auth.ini

ENV COUCHDB_USER=root
ENV COUCHDB_PASSWORD=root

COPY ./bootstrap_auth.sh /bootstrap_auth.sh

CMD sh /bootstrap_dbs.sh & (sh /bootstrap_auth.sh && /opt/couchdb/bin/couchdb)

