#!/bin/bash

# CityCare EHR Test Script
# Run this to test all available flows

BASE_URL="http://localhost:3000"

echo "=============================================="
echo "   CityCare EHR - Test Flow Script"
echo "=============================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test User Credentials
PATIENT_EMAIL="patient.test@citycare.com"
CLINICIAN_EMAIL="dr.smith@citycare.com"
LABTECH_EMAIL="labtech@citycare.com"
ADMIN_EMAIL="admin@citycare.com"
PASSWORD="Test123!"

echo "=== STEP 1: LOGIN ALL USERS ==="
echo ""

# Login Patient
echo "Logging in Patient..."
PATIENT_RESPONSE=$(curl -s -X POST "$BASE_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$PATIENT_EMAIL\",\"password\":\"$PASSWORD\"}")
PATIENT_TOKEN=$(echo $PATIENT_RESPONSE | jq -r '.accessToken')
if [ "$PATIENT_TOKEN" != "null" ]; then
  echo -e "${GREEN}✓ Patient logged in${NC}"
  PATIENT_INFO=$(curl -s -X GET "$BASE_URL/auth/me" -H "Authorization: Bearer $PATIENT_TOKEN")
  PATIENT_ID=$(echo $PATIENT_INFO | jq -r '.id')
  echo "  Patient ID: $PATIENT_ID"
else
  echo -e "${RED}✗ Patient login failed${NC}"
  echo $PATIENT_RESPONSE
fi

# Login Clinician
echo ""
echo "Logging in Clinician..."
CLINICIAN_RESPONSE=$(curl -s -X POST "$BASE_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$CLINICIAN_EMAIL\",\"password\":\"$PASSWORD\"}")
CLINICIAN_TOKEN=$(echo $CLINICIAN_RESPONSE | jq -r '.accessToken')
if [ "$CLINICIAN_TOKEN" != "null" ]; then
  echo -e "${GREEN}✓ Clinician logged in${NC}"
  CLINICIAN_INFO=$(curl -s -X GET "$BASE_URL/auth/me" -H "Authorization: Bearer $CLINICIAN_TOKEN")
  CLINICIAN_ID=$(echo $CLINICIAN_INFO | jq -r '.id')
  echo "  Clinician ID: $CLINICIAN_ID"
else
  echo -e "${RED}✗ Clinician login failed${NC}"
fi

# Login Lab Tech
echo ""
echo "Logging in Lab Technician..."
LABTECH_RESPONSE=$(curl -s -X POST "$BASE_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$LABTECH_EMAIL\",\"password\":\"$PASSWORD\"}")
LABTECH_TOKEN=$(echo $LABTECH_RESPONSE | jq -r '.accessToken')
if [ "$LABTECH_TOKEN" != "null" ]; then
  echo -e "${GREEN}✓ Lab Technician logged in${NC}"
else
  echo -e "${RED}✗ Lab Tech login failed${NC}"
fi

# Login Admin
echo ""
echo "Logging in Admin..."
ADMIN_RESPONSE=$(curl -s -X POST "$BASE_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$ADMIN_EMAIL\",\"password\":\"$PASSWORD\"}")
ADMIN_TOKEN=$(echo $ADMIN_RESPONSE | jq -r '.accessToken')
if [ "$ADMIN_TOKEN" != "null" ]; then
  echo -e "${GREEN}✓ Admin logged in${NC}"
else
  echo -e "${RED}✗ Admin login failed${NC}"
fi

echo ""
echo "=============================================="
echo "=== STEP 2: CLINICAL FLOW ==="
echo "=============================================="
echo ""

# Create Patient Chart
echo "Creating patient chart..."
CHART_RESPONSE=$(curl -s -X POST "$BASE_URL/clinical/patients/$PATIENT_ID/chart" \
  -H "Authorization: Bearer $CLINICIAN_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"bloodType\":\"O+\",\"dob\":\"1990-05-15\"}")
CHART_ID=$(echo $CHART_RESPONSE | jq -r '.id')
if [ "$CHART_ID" != "null" ] && [ -n "$CHART_ID" ]; then
  echo -e "${GREEN}✓ Chart created${NC}"
  echo "  Chart ID: $CHART_ID"
else
  echo -e "${YELLOW}Chart may already exist or error occurred${NC}"
  # Try to get existing chart
  CHART_RESPONSE=$(curl -s -X GET "$BASE_URL/clinical/patients/$PATIENT_ID/chart" \
    -H "Authorization: Bearer $CLINICIAN_TOKEN")
  CHART_ID=$(echo $CHART_RESPONSE | jq -r '.id')
  echo "  Existing Chart ID: $CHART_ID"
fi

# Add Allergy
echo ""
echo "Adding allergy (Penicillin - Severe)..."
ALLERGY_RESPONSE=$(curl -s -X POST "$BASE_URL/clinical/charts/$CHART_ID/allergies" \
  -H "Authorization: Bearer $CLINICIAN_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"allergenName\":\"Penicillin\",\"severity\":\"Severe\"}")
ALLERGY_ID=$(echo $ALLERGY_RESPONSE | jq -r '.id')
if [ "$ALLERGY_ID" != "null" ]; then
  echo -e "${GREEN}✓ Allergy added${NC}"
  echo "  Allergy ID: $ALLERGY_ID"
else
  echo -e "${YELLOW}Allergy may already exist${NC}"
fi

# Create Encounter
echo ""
echo "Creating clinical encounter..."
ENCOUNTER_RESPONSE=$(curl -s -X POST "$BASE_URL/clinical/encounters" \
  -H "Authorization: Bearer $CLINICIAN_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"patientId\":\"$PATIENT_ID\",\"clinicianId\":\"$CLINICIAN_ID\",\"chartId\":\"$CHART_ID\",\"chiefComplaint\":\"Headache and fever for 3 days\"}")
ENCOUNTER_ID=$(echo $ENCOUNTER_RESPONSE | jq -r '.id')
if [ "$ENCOUNTER_ID" != "null" ]; then
  echo -e "${GREEN}✓ Encounter created${NC}"
  echo "  Encounter ID: $ENCOUNTER_ID"
else
  echo -e "${RED}✗ Encounter creation failed${NC}"
  echo $ENCOUNTER_RESPONSE
fi

# Add SOAP Notes
echo ""
echo "Adding SOAP notes with vitals..."
SOAP_RESPONSE=$(curl -s -X POST "$BASE_URL/clinical/encounters/$ENCOUNTER_ID/notes" \
  -H "Authorization: Bearer $CLINICIAN_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"subjective\":\"Patient reports throbbing headache for 3 days, fever, and fatigue\",\"objective\":\"Temperature 101.2F, BP 125/82, HR 88, alert and oriented\",\"assessment\":\"Likely viral syndrome, rule out bacterial infection\",\"plan\":\"Rest, fluids, acetaminophen 500mg q6h PRN. Return if symptoms worsen.\",\"vitals\":{\"temperature\":101.2,\"bloodPressure\":\"125/82\",\"heartRate\":88,\"respiratoryRate\":16}}")
if echo $SOAP_RESPONSE | jq -e '.subjective' > /dev/null 2>&1; then
  echo -e "${GREEN}✓ SOAP notes added${NC}"
else
  echo -e "${YELLOW}SOAP notes response:${NC}"
  echo $SOAP_RESPONSE | jq .
fi

# Create Safe Prescription (Acetaminophen)
echo ""
echo "Creating prescription (Acetaminophen - should succeed)..."
RX_RESPONSE=$(curl -s -X POST "$BASE_URL/clinical/encounters/$ENCOUNTER_ID/prescriptions" \
  -H "Authorization: Bearer $CLINICIAN_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"medicationName\":\"Acetaminophen\",\"dosage\":\"500mg\",\"frequency\":\"Every 6 hours as needed\",\"duration\":\"7 days\",\"instructions\":\"Take with food\"}")
RX_ID=$(echo $RX_RESPONSE | jq -r '.id')
if [ "$RX_ID" != "null" ]; then
  echo -e "${GREEN}✓ Prescription created${NC}"
  echo "  Prescription ID: $RX_ID"
else
  echo -e "${RED}✗ Prescription failed${NC}"
  echo $RX_RESPONSE
fi

# Try Dangerous Prescription (Penicillin - should FAIL!)
echo ""
echo -e "${YELLOW}Attempting to prescribe Penicillin (patient is ALLERGIC - should FAIL)...${NC}"
DANGEROUS_RX=$(curl -s -X POST "$BASE_URL/clinical/encounters/$ENCOUNTER_ID/prescriptions" \
  -H "Authorization: Bearer $CLINICIAN_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"medicationName\":\"Penicillin\",\"dosage\":\"250mg\",\"frequency\":\"Twice daily\",\"duration\":\"10 days\"}")
if echo $DANGEROUS_RX | grep -q "ALLERGY"; then
  echo -e "${GREEN}✓ ALLERGY ALERT TRIGGERED - Prescription blocked!${NC}"
  echo "  Response: $(echo $DANGEROUS_RX | jq -r '.message')"
else
  echo -e "${RED}✗ Warning: Allergy check may not have worked${NC}"
  echo $DANGEROUS_RX
fi

echo ""
echo "=============================================="
echo "=== STEP 3: LAB ORDER FLOW ==="
echo "=============================================="
echo ""

# Create Lab Order (requires encounterId)
echo "Creating lab order..."
LAB_ORDER_RESPONSE=$(curl -s -X POST "$BASE_URL/lab/orders" \
  -H "Authorization: Bearer $CLINICIAN_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"encounterId\":\"$ENCOUNTER_ID\",\"priority\":\"Routine\"}")
ORDER_ID=$(echo $LAB_ORDER_RESPONSE | jq -r '.id')
if [ "$ORDER_ID" != "null" ]; then
  echo -e "${GREEN}✓ Lab order created${NC}"
  echo "  Order ID: $ORDER_ID"
else
  echo -e "${RED}✗ Lab order failed${NC}"
  echo $LAB_ORDER_RESPONSE
fi

# Add Test Item
echo ""
echo "Adding test item (Complete Blood Count)..."
TEST_ITEM_RESPONSE=$(curl -s -X POST "$BASE_URL/lab/orders/$ORDER_ID/test-items" \
  -H "Authorization: Bearer $CLINICIAN_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"testName\":\"Complete Blood Count (CBC)\"}")
TEST_ITEM_ID=$(echo $TEST_ITEM_RESPONSE | jq -r '.id')
if [ "$TEST_ITEM_ID" != "null" ]; then
  echo -e "${GREEN}✓ Test item added${NC}"
  echo "  Test Item ID: $TEST_ITEM_ID"
else
  echo -e "${RED}✗ Test item failed${NC}"
  echo $TEST_ITEM_RESPONSE
fi

# Lab Tech uploads result
echo ""
echo "Lab Technician uploading result..."
RESULT_RESPONSE=$(curl -s -X POST "$BASE_URL/lab/test-items/$TEST_ITEM_ID/results" \
  -H "Authorization: Bearer $LABTECH_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"resultValue\":\"WBC: 8.2, RBC: 4.9, Hemoglobin: 14.5, Hematocrit: 43%, Platelets: 250\",\"abnormalityFlag\":\"Normal\"}")
RESULT_ID=$(echo $RESULT_RESPONSE | jq -r '.id')
if [ "$RESULT_ID" != "null" ]; then
  echo -e "${GREEN}✓ Result uploaded${NC}"
  echo "  Result ID: $RESULT_ID"
else
  echo -e "${RED}✗ Result upload failed${NC}"
  echo $RESULT_RESPONSE
fi

# Clinician verifies result
echo ""
echo "Clinician verifying result..."
VERIFY_RESPONSE=$(curl -s -X PATCH "$BASE_URL/lab/results/$RESULT_ID/verify" \
  -H "Authorization: Bearer $CLINICIAN_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"notes\":\"Reviewed - normal CBC, no evidence of infection\"}")
if echo $VERIFY_RESPONSE | jq -e '.is_verified' > /dev/null 2>&1; then
  VERIFIED=$(echo $VERIFY_RESPONSE | jq -r '.is_verified')
  if [ "$VERIFIED" = "true" ]; then
    echo -e "${GREEN}✓ Result verified${NC}"
  fi
else
  echo -e "${YELLOW}Verify response:${NC}"
  echo $VERIFY_RESPONSE | jq .
fi

# Patient views results
echo ""
echo "Patient viewing their lab results..."
PATIENT_RESULTS=$(curl -s -X GET "$BASE_URL/lab/patients/$PATIENT_ID/results" \
  -H "Authorization: Bearer $PATIENT_TOKEN")
RESULT_COUNT=$(echo $PATIENT_RESULTS | jq '. | length')
echo -e "${GREEN}✓ Patient can see $RESULT_COUNT verified result(s)${NC}"

echo ""
echo "=============================================="
echo "=== STEP 4: ADMIN OPERATIONS ==="
echo "=============================================="
echo ""

# Admin Dashboard
echo "Admin viewing dashboard stats..."
DASHBOARD=$(curl -s -X GET "$BASE_URL/admin/dashboard" \
  -H "Authorization: Bearer $ADMIN_TOKEN")
echo -e "${GREEN}✓ Dashboard Stats:${NC}"
echo $DASHBOARD | jq .

# List Users
echo ""
echo "Admin listing users..."
USERS=$(curl -s -X GET "$BASE_URL/admin/users" \
  -H "Authorization: Bearer $ADMIN_TOKEN")
USER_COUNT=$(echo $USERS | jq '.meta.total')
echo -e "${GREEN}✓ Total users in system: $USER_COUNT${NC}"

# List Roles
echo ""
echo "Admin viewing roles..."
ROLES=$(curl -s -X GET "$BASE_URL/admin/roles" \
  -H "Authorization: Bearer $ADMIN_TOKEN")
echo -e "${GREEN}✓ System Roles:${NC}"
echo $ROLES | jq '.[] | {name: .name, userCount: ._count.users}'

# Audit Logs
echo ""
echo "Admin viewing audit logs..."
AUDIT=$(curl -s -X GET "$BASE_URL/admin/audit-logs?limit=5" \
  -H "Authorization: Bearer $ADMIN_TOKEN")
LOG_COUNT=$(echo $AUDIT | jq '.meta.total')
echo -e "${GREEN}✓ Total audit log entries: $LOG_COUNT${NC}"

echo ""
echo "=============================================="
echo "=== TEST SUMMARY ==="
echo "=============================================="
echo ""
echo "Test Users Created:"
echo "  - Patient: $PATIENT_EMAIL / $PASSWORD"
echo "  - Clinician: $CLINICIAN_EMAIL / $PASSWORD"
echo "  - Lab Tech: $LABTECH_EMAIL / $PASSWORD"
echo "  - Admin: $ADMIN_EMAIL / $PASSWORD"
echo ""
echo "IDs for Frontend Testing:"
echo "  - Patient ID: $PATIENT_ID"
echo "  - Clinician ID: $CLINICIAN_ID"
echo "  - Chart ID: $CHART_ID"
echo "  - Encounter ID: $ENCOUNTER_ID"
echo ""
echo "Frontend URLs to Test:"
echo "  - Patient Login: http://localhost:5173/login"
echo "  - Clinician Login: http://localhost:5173/clinician/signin"
echo ""
echo "=============================================="
echo -e "${GREEN}All tests completed!${NC}"
echo "=============================================="
