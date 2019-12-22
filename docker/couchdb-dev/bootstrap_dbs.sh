sleep 15

curl -X PUT "http://$COUCHDB_USER:$COUCHDB_PASSWORD@localhost:$INTERNAL_PORT/_users"
curl -X PUT "http://$COUCHDB_USER:$COUCHDB_PASSWORD@localhost:$INTERNAL_PORT/_replicator"
curl -X PUT "http://$COUCHDB_USER:$COUCHDB_PASSWORD@localhost:$INTERNAL_PORT/_global_changes"
