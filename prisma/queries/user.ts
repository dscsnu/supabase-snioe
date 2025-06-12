import { Prisma } from "@prisma/client";

export const userQueries = [
    Prisma.sql`
        -- Build a users permissions from their group assignments
        CREATE OR REPLACE FUNCTION fn_build_user_permissions(u_id UUID)
        RETURNS JSONB
        LANGUAGE plpgsql
        SECURITY DEFINER
        SET search_path = ''
        AS $$
        DECLARE
            result JSONB;
        BEGIN
            SELECT COALESCE(
                jsonb_agg(
                    jsonb_build_object (
                        'id', g.id,
                        'name', g.name,
                        'permissions', COALESCE(g.permissions, '[]'::jsonb)
                    )
                ),
                '[]'::jsonb
            )
            INTO result
            FROM (
                SELECT
                    g.id,
                    g.name,
                    jsonb_agg(gpa.permission_id) as permissions
                FROM public.Group g
                INNER JOIN public.GroupUserAssignment gua ON g.id = gua.group_id
                LEFT JOIN public.GroupPermissionAssignment gpa ON g.id = gpa.group_id
                WHERE gua.user_id = u_id
                GROUP BY g.id, g.name
            ) g;

            RETURN result;
        END;
        $$;
    `,
    Prisma.sql`
        CREATE OR REPLACE FUNCTION fn_update_user_custom_claims(u_id UUID)
        RETURNS VOID
        LANGUAGE plpgsql
        SECURITY DEFINER
        SET search_path = ''
        AS $$
        DECLARE
            user_permissions JSONB;
        BEGIN
            SELECT public.fn_build_user_permissions(u_id) INTO user_permissions;

            UPDATE auth.users
            SET raw_app_meta_data = jsonb_set(
                COALESCE(raw_app_meta_data, '{}'::jsonb),
                '{custom_claims}',
                jsonb_build_object(
                    -- Add other custom claims here
                    -- 'whitelisted', false,
                    'groups', user_permissions
                ),
                true
            )
            WHERE id = u_id;
        END;
        $$;
    `,

    // auth.users inserts
    Prisma.sql`
        CREATE OR REPLACE FUNCTION fn_on_auth_new_user()
        RETURNS TRIGGER
        LANGUAGE plpgsql
        SECURITY DEFINER
        SET search_path = ''
        AS $$
        BEGIN
            INSERT INTO public.UserProfile (id, name, email)
            VALUES (NEW.id, '', '');

            UPDATE public.UserProfile SET
                name = COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', ''),
                email = COALESCE(NEW.email, '')
            WHERE id = NEW.id;

            PERFORM public.fn_update_user_custom_claims(NEW.id);

            RETURN NEW;
        END;
        $$;
    `,
    Prisma.sql`
        CREATE OR REPLACE TRIGGER tr_on_auth_new_user
            AFTER INSERT ON auth.users
            FOR EACH ROW EXECUTE PROCEDURE fn_on_auth_new_user();
    `,


    // public.UserProfile updates
    Prisma.sql`
        CREATE OR REPLACE FUNCTION fn_on_user_update()
        RETURNS TRIGGER
        LANGUAGE plpgsql
        SECURITY DEFINER
        SET search_path = ''
        AS $$
        BEGIN
            PERFORM public.fn_update_user_custom_claims(NEW.id);
            RETURN NEW;
        END;
        $$;
    `,
    Prisma.sql`
        CREATE OR REPLACE TRIGGER tr_on_user_update
            AFTER UPDATE ON public.UserProfile
            FOR EACH ROW EXECUTE PROCEDURE fn_on_user_update();
    `,

    // public.GroupUserAssignment changes
    Prisma.sql`
        CREATE OR REPLACE FUNCTION fn_on_group_user_assignment_change()
        RETURNS TRIGGER
        LANGUAGE plpgsql
        SECURITY DEFINER
        SET search_path = ''
        AS $$
        BEGIN
            IF TG_OP = 'DELETE' THEN
                PERFORM public.fn_update_user_custom_claims(OLD.user_id);
                RETURN OLD;
            ELSE
                PERFORM public.fn_update_user_custom_claims(NEW.user_id);
                RETURN NEW;
            END IF;
        END;
        $$;
    `,
    Prisma.sql`
        CREATE OR REPLACE TRIGGER tr_on_group_user_assignment_change
            AFTER INSERT OR DELETE on public.GroupUserAssignment
            FOR EACH ROW EXECUTE PROCEDURE fn_on_group_user_assignment_change();
    `,

    // public.GroupPermissionAssignment changes
    Prisma.sql`
        CREATE OR REPLACE FUNCTION fn_on_group_permission_assignment_change()
        RETURNS TRIGGER
        LANGUAGE plpgsql
        SECURITY DEFINER
        SET search_path = ''
        AS $$
        DECLARE
            affected_user_id UUID;
        BEGIN
            FOR affected_user_id IN
                SELECT gua.user_id
                FROM public.GroupUserAssignment gua
                WHERE gua.group_id = COALESCE(NEW.group_id, OLD.group_id)
            LOOP
                PERFORM public.fn_update_user_custom_claims(affected_user_id);
            END LOOP;

            RETURN COALESCE(NEW, OLD);
        END;
        $$;
    `,
    Prisma.sql`
        CREATE OR REPLACE TRIGGER tr_on_group_permissions_assignment_change
            AFTER INSERT OR DELETE on public.GroupPermissionAssignment
            FOR EACH ROW EXECUTE PROCEDURE fn_on_group_permission_assignment_change();
    `,

    // auth.users deletions
    Prisma.sql`
        CREATE OR REPLACE FUNCTION fn_on_auth_delete_user()
        RETURNS trigger
        LANGUAGE plpgsql
        SECURITY DEFINER
        SET search_path = ''
        AS $$
        BEGIN
            DELETE FROM public.userprofile WHERE id = old.id;
            RETURN old;
        END;
        $$;
    `,

    Prisma.sql`
        CREATE OR REPLACE TRIGGER tr_on_auth_delete_user
            AFTER DELETE ON auth.users
            FOR EACH ROW EXECUTE PROCEDURE fn_on_auth_delete_user();
    `,
];