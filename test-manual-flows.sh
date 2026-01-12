#!/bin/bash

# CityCare Manual Test Flows
# Run this script to set up test data and get instructions for manual testing

BASE_URL="http://localhost:3000"
FRONTEND_URL="http://localhost:5174"

echo "=============================================="
echo "   CityCare - Manual Testing Flows"
echo "=============================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${BLUE}Backend URL:${NC} $BASE_URL"
echo -e "${BLUE}Frontend URL:${NC} $FRONTEND_URL"
echo ""

# ============================================
# TEST ACCOUNTS
# ============================================
echo -e "${GREEN}=== TEST ACCOUNTS ===${NC}"
echo ""
echo "All accounts use password: Test123!"
echo ""
echo "| Role          | Email                        | Name          |"
echo "|---------------|------------------------------|---------------|"
echo "| Patient       | patient.test@citycare.com    | Jane Doe      |"
echo "| Clinician     | dr.smith@citycare.com        | John Smith    |"
echo "| Lab Tech      | labtech@citycare.com         | Lab Tech      |"
echo "| Admin         | admin@citycare.com           | System Admin  |"
echo ""

# ============================================
# FLOW 1: Patient Login & Dashboard
# ============================================
echo -e "${GREEN}=== FLOW 1: Patient Portal ===${NC}"
echo ""
echo "1. Open: $FRONTEND_URL/login"
echo "2. Login with: patient.test@citycare.com / Test123!"
echo "3. You should see the Patient Dashboard with:"
echo "   - Upcoming appointments"
echo "   - Quick actions (Book Appointment, Medical Records, etc.)"
echo "   - Recent activity"
echo ""
echo "4. Navigate to each page:"
echo "   - /appointments - View and manage appointments"
echo "   - /medical-records - View medical history"
echo "   - /prescriptions - View prescriptions"
echo "   - /lab-results - View lab results"
echo "   - /billing - View invoices"
echo "   - /profile - View and edit profile"
echo ""

# ============================================
# FLOW 2: Clinician Login & Dashboard
# ============================================
echo -e "${GREEN}=== FLOW 2: Clinician Portal ===${NC}"
echo ""
echo "1. Open: $FRONTEND_URL/clinician/signin"
echo "2. Login with: dr.smith@citycare.com / Test123!"
echo "3. You should see the Clinician Dashboard with:"
echo "   - Upcoming appointments"
echo "   - Quick actions"
echo "   - Recent lab results"
echo ""
echo "4. Navigate to each page:"
echo "   - /clinician/dashboard - Home"
echo "   - /clinician/appointments - Manage appointments"
echo "   - /clinician/patients - Search and view patients"
echo "   - /clinician/labs - View and manage lab orders"
echo "   - /clinician/profile - View profile"
echo ""

# ============================================
# FLOW 3: Create Test Data via API
# ============================================
echo -e "${GREEN}=== FLOW 3: Creating Test Data ===${NC}"
echo ""

# Login as clinician and get token
echo "Logging in as clinician to create test data..."
CLINICIAN_TOKEN=$(curl -s "$BASE_URL/auth/login" \
  -X POST \
  -H "Content-Type: application/json" \
  -d '{"email":"dr.smith@citycare.com","password":"Test123!"}' \
  | grep -o '"accessToken":"[^"]*' | cut -d'"' -f4)

if [ -n "$CLINICIAN_TOKEN" ]; then
  echo -e "${GREEN}Clinician login successful!${NC}"

  # Get clinician's user ID
  CLINICIAN_INFO=$(curl -s "$BASE_URL/auth/me" \
    -H "Authorization: Bearer $CLINICIAN_TOKEN")
  CLINICIAN_ID=$(echo $CLINICIAN_INFO | grep -o '"id":"[^"]*' | head -1 | cut -d'"' -f4)
  echo "Clinician ID: $CLINICIAN_ID"

  # Create availability slots for the clinician
  echo ""
  echo "Creating availability slots for clinician..."

  # Create slots for next 7 days
  for i in {1..3}; do
    SLOT_DATE=$(date -v+${i}d +%Y-%m-%d)
    START_TIME="${SLOT_DATE}T09:00:00.000Z"
    END_TIME="${SLOT_DATE}T10:00:00.000Z"

    SLOT_RESULT=$(curl -s "$BASE_URL/scheduling/slots" \
      -X POST \
      -H "Content-Type: application/json" \
      -H "Authorization: Bearer $CLINICIAN_TOKEN" \
      -d "{\"clinicianId\":\"$CLINICIAN_ID\",\"startTime\":\"$START_TIME\",\"endTime\":\"$END_TIME\"}" 2>/dev/null)

    if echo "$SLOT_RESULT" | grep -q '"id"'; then
      echo "  Created slot for $SLOT_DATE 9:00 AM - 10:00 AM"
    fi
  done

  echo ""
else
  echo -e "${YELLOW}Could not login as clinician. Skipping test data creation.${NC}"
fi

# Login as patient
echo "Logging in as patient..."
PATIENT_TOKEN=$(curl -s "$BASE_URL/auth/login" \
  -X POST \
  -H "Content-Type: application/json" \
  -d '{"email":"patient.test@citycare.com","password":"Test123!"}' \
  | grep -o '"accessToken":"[^"]*' | cut -d'"' -f4)

if [ -n "$PATIENT_TOKEN" ]; then
  echo -e "${GREEN}Patient login successful!${NC}"

  PATIENT_INFO=$(curl -s "$BASE_URL/auth/me" \
    -H "Authorization: Bearer $PATIENT_TOKEN")
  PATIENT_ID=$(echo $PATIENT_INFO | grep -o '"id":"[^"]*' | head -1 | cut -d'"' -f4)
  echo "Patient ID: $PATIENT_ID"
else
  echo -e "${YELLOW}Could not login as patient.${NC}"
fi

echo ""

# ============================================
# FLOW 4: Booking Flow (Manual)
# ============================================
echo -e "${GREEN}=== FLOW 4: Appointment Booking (Manual Test) ===${NC}"
echo ""
echo "1. Login as Patient at $FRONTEND_URL/login"
echo "2. Click 'Book Appointment' on the dashboard"
echo "3. Select a clinician (Dr. Smith should appear)"
echo "4. Select an available date/time"
echo "5. Confirm the booking"
echo "6. Verify the appointment appears in your dashboard"
echo ""

# ============================================
# FLOW 5: Check Available Slots
# ============================================
echo -e "${GREEN}=== FLOW 5: API Test - Get Available Slots ===${NC}"
echo ""
TODAY=$(date +%Y-%m-%d)
echo "Checking available slots for today ($TODAY)..."
if [ -n "$CLINICIAN_ID" ]; then
  SLOTS=$(curl -s "$BASE_URL/scheduling/slots/available?clinicianId=$CLINICIAN_ID&date=$TODAY" \
    -H "Authorization: Bearer $PATIENT_TOKEN")
  echo "Response: $SLOTS"
fi
echo ""

# ============================================
# FLOW 6: Get Clinicians List
# ============================================
echo -e "${GREEN}=== FLOW 6: API Test - Get Clinicians ===${NC}"
echo ""
echo "Fetching list of clinicians..."
if [ -n "$PATIENT_TOKEN" ]; then
  CLINICIANS=$(curl -s "$BASE_URL/scheduling/clinicians" \
    -H "Authorization: Bearer $PATIENT_TOKEN")
  echo "Response: $CLINICIANS"
fi
echo ""

# ============================================
# SUMMARY
# ============================================
echo -e "${GREEN}=============================================="
echo "   TESTING CHECKLIST"
echo "==============================================${NC}"
echo ""
echo "Patient Portal ($FRONTEND_URL):"
echo "  [ ] Login as patient"
echo "  [ ] View dashboard"
echo "  [ ] Navigate to Appointments"
echo "  [ ] Navigate to Medical Records"
echo "  [ ] Navigate to Prescriptions"
echo "  [ ] Navigate to Lab Results"
echo "  [ ] Navigate to Billing"
echo "  [ ] View and edit Profile"
echo ""
echo "Clinician Portal ($FRONTEND_URL/clinician/signin):"
echo "  [ ] Login as clinician"
echo "  [ ] View dashboard with appointments"
echo "  [ ] Navigate to Patients and search"
echo "  [ ] Navigate to Labs"
echo "  [ ] View Profile"
echo ""
echo "Registration:"
echo "  [ ] Register new patient at $FRONTEND_URL/signup"
echo "  [ ] Register new clinician at $FRONTEND_URL/clinician/signup"
echo ""
echo -e "${BLUE}Happy Testing!${NC}"
