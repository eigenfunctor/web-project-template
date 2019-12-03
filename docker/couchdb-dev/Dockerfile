FROM couchdb:2

ENV PORT=5986

RUN \
  echo "[chttpd]" > /opt/couchdb/etc/local.d/proxy_auth.ini && \
  echo "authentication_handlers = {chttpd_auth, cookie_authentication_handler}, {chttpd_auth, proxy_authentication_handler}, {chttpd_auth, default_authentication_handler}" >> /opt/couchdb/etc/local.d/proxy_auth.ini

RUN \
  echo "sleep 3" > /startup.sh && \
  echo "curl \ " >> /startup.sh && \
  echo "-H x-auth-couchdb-username=initializer \ " >> /startup.sh && \
  echo "-H x-auth-couchdb-roles=admin \ " >> /startup.sh && \
  echo "-X PUT http://127.0.0.1:\$PORT/_user" >> /startup.sh && \
  echo "curl \ " >> /startup.sh && \
  echo "-H x-auth-couchdb-username=initializer \ " >> /startup.sh && \
  echo "-H x-auth-couchdb-roles=admin \ " >> /startup.sh && \
  echo "-X PUT http://127.0.0.1:\$PORT/_replicator" >> /startup.sh && \
  echo "curl \ " >> /startup.sh && \
  echo "-H x-auth-couchdb-username=initializer \ " >> /startup.sh && \
  echo "-H x-auth-couchdb-roles=admin \ " >> /startup.sh && \
  echo "-X PUT http://127.0.0.1:\$PORT/_global_changes" >> /startup.sh

CMD /opt/couchdb/bin/couchdb & { sh /startup.sh; fg; }

