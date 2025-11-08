#!/bin/bash

echo "Testing LivelyHealthCheck API..."
echo ""

# Test 1: Check if API is responding
echo "Test 1: GET /api/healthchecks"
curl -s http://localhost:3000/api/healthchecks | jq '.checks | length'
echo ""

# Test 2: Add a new health check
echo "Test 2: POST /api/healthchecks"
RESPONSE=$(curl -s -X POST http://localhost:3000/api/healthchecks \
  -H "Content-Type: application/json" \
  -d '{"url":"http://localhost:3000/api/ping","name":"Test API","interval":5000}')
ID=$(echo $RESPONSE | jq -r '.id')
echo "Created health check with ID: $ID"
echo ""

# Wait for a check to complete
echo "Waiting 6 seconds for health check to run..."
sleep 6
echo ""

# Test 3: Get specific health check with history
echo "Test 3: GET /api/healthchecks/$ID"
curl -s http://localhost:3000/api/healthchecks/$ID | jq '{url: .url, name: .name, resultsCount: (.results | length), latestStatus: .results[-1].status}'
echo ""

# Test 4: Get all health checks
echo "Test 4: GET /api/healthchecks (should now have 2)"
curl -s http://localhost:3000/api/healthchecks | jq '.checks | length'
echo ""

# Test 5: Delete health check
echo "Test 5: DELETE /api/healthchecks/$ID"
curl -s -X DELETE http://localhost:3000/api/healthchecks/$ID | jq '.message'
echo ""

# Test 6: Verify deletion
echo "Test 6: GET /api/healthchecks (should be back to 1)"
curl -s http://localhost:3000/api/healthchecks | jq '.checks | length'
echo ""

echo "All tests completed!"
