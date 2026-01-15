-- ============================================
-- AUTOMATIC AUDIT LOGGING TRIGGERS
-- ============================================
-- This script creates PostgreSQL triggers that automatically log
-- INSERT, UPDATE, and DELETE operations to the system_audit_logs table.

-- Create the audit logging function
CREATE OR REPLACE FUNCTION log_audit_changes()
RETURNS TRIGGER AS $$
DECLARE
    old_data JSONB;
    new_data JSONB;
    user_id UUID;
BEGIN
    -- Try to get user_id from the record if it exists
    -- For most tables, we'll use the session variable if set
    BEGIN
        user_id := current_setting('app.current_user_id', true)::UUID;
    EXCEPTION WHEN OTHERS THEN
        user_id := NULL;
    END;

    IF TG_OP = 'DELETE' THEN
        old_data := to_jsonb(OLD);
        new_data := NULL;

        INSERT INTO system_audit_logs (table_name, record_id, action, old_data, new_data, changed_by, changed_at)
        VALUES (TG_TABLE_NAME, OLD.id, 'DELETE', old_data, new_data, user_id, NOW());

        RETURN OLD;
    ELSIF TG_OP = 'UPDATE' THEN
        old_data := to_jsonb(OLD);
        new_data := to_jsonb(NEW);

        -- Only log if there are actual changes
        IF old_data IS DISTINCT FROM new_data THEN
            INSERT INTO system_audit_logs (table_name, record_id, action, old_data, new_data, changed_by, changed_at)
            VALUES (TG_TABLE_NAME, NEW.id, 'UPDATE', old_data, new_data, user_id, NOW());
        END IF;

        RETURN NEW;
    ELSIF TG_OP = 'INSERT' THEN
        old_data := NULL;
        new_data := to_jsonb(NEW);

        INSERT INTO system_audit_logs (table_name, record_id, action, old_data, new_data, changed_by, changed_at)
        VALUES (TG_TABLE_NAME, NEW.id, 'INSERT', old_data, new_data, user_id, NOW());

        RETURN NEW;
    END IF;

    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Drop existing triggers if they exist (to allow re-running this script)
DROP TRIGGER IF EXISTS audit_users ON users;
DROP TRIGGER IF EXISTS audit_appt_bookings ON appt_bookings;
DROP TRIGGER IF EXISTS audit_appt_slots ON appt_slots;
DROP TRIGGER IF EXISTS audit_lab_orders ON lab_orders;
DROP TRIGGER IF EXISTS audit_lab_results ON lab_results;
DROP TRIGGER IF EXISTS audit_lab_test_items ON lab_test_items;
DROP TRIGGER IF EXISTS audit_patient_prescriptions ON patient_prescriptions;
DROP TRIGGER IF EXISTS audit_patient_encounters ON patient_encounters;
DROP TRIGGER IF EXISTS audit_patient_charts ON patient_charts;
DROP TRIGGER IF EXISTS audit_billing_invoices ON billing_invoices;
DROP TRIGGER IF EXISTS audit_billing_line_items ON billing_line_items;

-- Create triggers on key tables

-- Users table
CREATE TRIGGER audit_users
    AFTER INSERT OR UPDATE OR DELETE ON users
    FOR EACH ROW EXECUTE FUNCTION log_audit_changes();

-- Appointment bookings
CREATE TRIGGER audit_appt_bookings
    AFTER INSERT OR UPDATE OR DELETE ON appt_bookings
    FOR EACH ROW EXECUTE FUNCTION log_audit_changes();

-- Appointment slots
CREATE TRIGGER audit_appt_slots
    AFTER INSERT OR UPDATE OR DELETE ON appt_slots
    FOR EACH ROW EXECUTE FUNCTION log_audit_changes();

-- Lab orders
CREATE TRIGGER audit_lab_orders
    AFTER INSERT OR UPDATE OR DELETE ON lab_orders
    FOR EACH ROW EXECUTE FUNCTION log_audit_changes();

-- Lab results
CREATE TRIGGER audit_lab_results
    AFTER INSERT OR UPDATE OR DELETE ON lab_results
    FOR EACH ROW EXECUTE FUNCTION log_audit_changes();

-- Lab test items
CREATE TRIGGER audit_lab_test_items
    AFTER INSERT OR UPDATE OR DELETE ON lab_test_items
    FOR EACH ROW EXECUTE FUNCTION log_audit_changes();

-- Patient prescriptions
CREATE TRIGGER audit_patient_prescriptions
    AFTER INSERT OR UPDATE OR DELETE ON patient_prescriptions
    FOR EACH ROW EXECUTE FUNCTION log_audit_changes();

-- Patient encounters
CREATE TRIGGER audit_patient_encounters
    AFTER INSERT OR UPDATE OR DELETE ON patient_encounters
    FOR EACH ROW EXECUTE FUNCTION log_audit_changes();

-- Patient charts
CREATE TRIGGER audit_patient_charts
    AFTER INSERT OR UPDATE OR DELETE ON patient_charts
    FOR EACH ROW EXECUTE FUNCTION log_audit_changes();

-- Billing invoices
CREATE TRIGGER audit_billing_invoices
    AFTER INSERT OR UPDATE OR DELETE ON billing_invoices
    FOR EACH ROW EXECUTE FUNCTION log_audit_changes();

-- Billing line items
CREATE TRIGGER audit_billing_line_items
    AFTER INSERT OR UPDATE OR DELETE ON billing_line_items
    FOR EACH ROW EXECUTE FUNCTION log_audit_changes();

-- Grant necessary permissions
GRANT USAGE ON SEQUENCE system_audit_logs_id_seq TO PUBLIC;

-- Confirmation message
DO $$
BEGIN
    RAISE NOTICE 'Audit logging triggers have been set up successfully!';
    RAISE NOTICE 'The following tables are now being audited:';
    RAISE NOTICE '  - users';
    RAISE NOTICE '  - appt_bookings';
    RAISE NOTICE '  - appt_slots';
    RAISE NOTICE '  - lab_orders';
    RAISE NOTICE '  - lab_results';
    RAISE NOTICE '  - lab_test_items';
    RAISE NOTICE '  - patient_prescriptions';
    RAISE NOTICE '  - patient_encounters';
    RAISE NOTICE '  - patient_charts';
    RAISE NOTICE '  - billing_invoices';
    RAISE NOTICE '  - billing_line_items';
END $$;
