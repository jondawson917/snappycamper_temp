\echo 'Delete and create SnappyCamper database?'
\prompt 'Return for yes or control-C to cancel >' foo

DROP DATABASE snappycamper;
CREATE DATABASE snappycamper;
\connect snappycamper

\i snappy-schema.sql
\i snappy-seed.sql


\echo 'Delete and create snappyCamper_test database?'
\prompt 'Return for yes or control-C to cancel >' foo

DROP DATABASE snappyCamper_test;
CREATE DATABASE snappyCamper_test;
\connect snappycamper_test;

\i snappy-schema.sql
\i snappy-seed.sql