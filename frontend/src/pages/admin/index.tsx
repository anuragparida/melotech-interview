import { useAdmin } from "@/lib/hooks/useAdmin";

function Admin() {
  const { isAdmin, loading } = useAdmin();

  if (loading) return <p>Loading...</p>;

  return (
    <>
      {isAdmin ? (
        <p>Welcome, Admin!</p>
      ) : (
        <p>You do not have access to this page.</p>
      )}
    </>
  );
}

export default Admin;
