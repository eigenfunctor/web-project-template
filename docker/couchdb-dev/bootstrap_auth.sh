echo "[admins]" > /opt/couchdb/etc/local.d/docker-admins.ini
echo "$COUCHDB_USER = $COUCHDB_PASSWORD" >> /opt/couchdb/etc/local.d/docker-admins.ini

if test ! -z $COUCHDB_AUTH_SECRET; then
  echo "" >> /opt/couchdb/etc/local.d/auth_secret.ini
  echo "[couch_httpd_auth]" >> /opt/couchdb/etc/local.d/auth_secret.ini
  echo "secret = $COUCHDB_AUTH_SECRET" >> /opt/couchdb/etc/local.d/auth_secret.ini
  echo "proxy_use_secret = true" >> /opt/couchdb/etc/local.d/auth_secret.ini
fi

