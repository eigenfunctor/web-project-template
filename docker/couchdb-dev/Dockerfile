FROM couchdb:2

ENV PORT=5986

COPY ./bootstrap_dbs.sh /bootstrap_dbs.sh
COPY ./proxy_auth.ini /opt/couchdb/etc/local.d/proxy_auth.ini

ENV COUCHDB_USER=root
ENV COUCHDB_PASSWORD=root

COPY ./bootstrap_admin.sh /bootstrap_admin.sh

CMD sh /bootstrap_dbs.sh & (sh /bootstrap_admin.sh && /opt/couchdb/bin/couchdb)

