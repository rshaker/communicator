/** IDB integrity-test harness

Ping + Request-response: given # of iterations, # of contexts, and # of messages
- Verify count of messages sent and received in each context
- Verify contents of each message (example json)
- Verify expected time intervals between messages (avg, min, max)
- Verify responses to requests are correct as expected
- Verify all indexes are correct
- Verify all uuids are unique
- Verify all paths arrays for: length, context order

*/