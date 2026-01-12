#!/bin/bash

# Test Billing Module
BASE_URL="http://localhost:3000"

# First login as patient to get token
echo "=== LOGGING IN AS PATIENT ==="
LOGIN_RESPONSE=$(curl -s -X POST "$BASE_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email": "john.patient@example.com", "password": "password123"}')
echo "$LOGIN_RESPONSE" | head -c 200

PATIENT_TOKEN=$(echo $LOGIN_RESPONSE | grep -o '"accessToken":"[^"]*"' | cut -d'"' -f4)
PATIENT_ID=$(echo $LOGIN_RESPONSE | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
echo ""
echo "Patient ID: $PATIENT_ID"

# Login as clinician
echo ""
echo "=== LOGGING IN AS CLINICIAN ==="
CLINICIAN_LOGIN=$(curl -s -X POST "$BASE_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email": "dr.smith@example.com", "password": "password123"}')
CLINICIAN_TOKEN=$(echo $CLINICIAN_LOGIN | grep -o '"accessToken":"[^"]*"' | cut -d'"' -f4)
echo "Clinician logged in"

# Test Get Patient Invoices
echo ""
echo "=== GET PATIENT INVOICES ==="
curl -s -X GET "$BASE_URL/billing/invoices/patient/$PATIENT_ID" \
  -H "Authorization: Bearer $PATIENT_TOKEN" | head -c 500

# Test Get All Invoices (as patient - should fail or return only their invoices)
echo ""
echo ""
echo "=== GET ALL INVOICES (as patient) ==="
curl -s -X GET "$BASE_URL/billing/invoices" \
  -H "Authorization: Bearer $PATIENT_TOKEN" | head -c 500

# Test Get All Invoices (as clinician)
echo ""
echo ""
echo "=== GET ALL INVOICES (as clinician) ==="
curl -s -X GET "$BASE_URL/billing/invoices" \
  -H "Authorization: Bearer $CLINICIAN_TOKEN" | head -c 500

# Test Create Invoice (as clinician)
echo ""
echo ""
echo "=== CREATE INVOICE (as clinician) ==="
INVOICE_RESPONSE=$(curl -s -X POST "$BASE_URL/billing/invoices" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $CLINICIAN_TOKEN" \
  -d "{
    \"patientId\": \"$PATIENT_ID\",
    \"lineItems\": [
      {
        \"description\": \"Office Visit\",
        \"quantity\": 1,
        \"unitPrice\": 150.00
      },
      {
        \"description\": \"Blood Test\",
        \"quantity\": 1,
        \"unitPrice\": 75.00
      }
    ],
    \"notes\": \"Routine checkup billing\"
  }")
echo "$INVOICE_RESPONSE" | head -c 500

INVOICE_ID=$(echo $INVOICE_RESPONSE | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
echo ""
echo "Invoice ID: $INVOICE_ID"

# Test Get Invoice by ID
echo ""
echo "=== GET INVOICE BY ID ==="
curl -s -X GET "$BASE_URL/billing/invoices/$INVOICE_ID" \
  -H "Authorization: Bearer $PATIENT_TOKEN" | head -c 500

# Test Update Invoice Status
echo ""
echo ""
echo "=== UPDATE INVOICE STATUS ==="
curl -s -X PATCH "$BASE_URL/billing/invoices/$INVOICE_ID" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $CLINICIAN_TOKEN" \
  -d '{"status": "Sent"}' | head -c 500

# Test Process Payment
echo ""
echo ""
echo "=== PROCESS PAYMENT ==="
curl -s -X POST "$BASE_URL/billing/invoices/$INVOICE_ID/payment" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $PATIENT_TOKEN" \
  -d '{
    "amount": 225.00,
    "paymentMethod": "Credit Card"
  }' | head -c 500

# Test Get Invoice After Payment
echo ""
echo ""
echo "=== GET INVOICE AFTER PAYMENT ==="
curl -s -X GET "$BASE_URL/billing/invoices/$INVOICE_ID" \
  -H "Authorization: Bearer $PATIENT_TOKEN" | head -c 500

echo ""
echo ""
echo "=== BILLING MODULE TESTING COMPLETE ==="
