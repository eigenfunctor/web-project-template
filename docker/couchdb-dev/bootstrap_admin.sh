echo "[admins]" > /opt/couchdb/etc/local.d/docker-admins.ini
echo "$COUCHDB_USER = $COUCHDB_PASSWORD" >> /opt/couchdb/etc/local.d/docker-admins.ini

