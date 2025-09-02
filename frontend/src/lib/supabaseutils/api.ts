// getUser.js
import supabase from "../supabase";

// Helper function to get the user record ID from the users table
async function getUserRecordId() {
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError) throw authError;
  if (!user) throw new Error("No authenticated user");

  const { data: userRecord, error: userError } = await supabase
    .from("users")
    .select("id")
    .eq("authid", user.id)
    .single();

  if (userError) throw userError;
  if (!userRecord) throw new Error("User record not found");

  return userRecord.id;
}

export async function getUser() {
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError) throw authError;
  if (!user) throw new Error("No authenticated user");

  const { data, error } = await supabase
    .from("users")
    .select("*")
    .eq("authid", user.id)
    .single();

  if (error) throw error;
  return data;
}

export async function updateUser(updates: any) {
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError) throw authError;
  if (!user) throw new Error("No authenticated user");

  const { data, error } = await supabase
    .from("users")
    .update(updates)
    .eq("authid", user.id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function createSubmission(submissionData: any, files: File[]) {
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError) throw authError;
  if (!user) throw new Error("No authenticated user");

  try {
    // 1️⃣ Get the user record ID from users table
    const userId = await getUserRecordId();

    // 2️⃣ Upload files asynchronously
    const uploadPromises = files.map(async (file: File) => {
      const fileName = `${Date.now()}-${file.name}`;
      const filePath = `${user.id}/${fileName}`; // folder = user.id

      const { error: uploadError } = await supabase.storage
        .from("melotechaudio") // your bucket name
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Generate signed URL with token (valid for 1 month)
      const { data: signedUrlData, error: signedUrlError } =
        await supabase.storage
          .from("melotechaudio")
          .createSignedUrl(filePath, 60 * 60 * 24 * 30); // 30 days in seconds

      if (signedUrlError) {
        console.error("Error creating signed URL:", signedUrlError);
        // Fallback to public URL if signed URL fails
        const { data } = supabase.storage
          .from("melotechaudio")
          .getPublicUrl(filePath);
        return data.publicUrl;
      }

      console.log("✅ Generated signed URL for:", filePath);
      return signedUrlData.signedUrl;
    });

    const fileUrls = await Promise.all(uploadPromises);

    console.log("📁 Generated file URLs:", fileUrls);
    fileUrls.forEach((url: string, index: number) => {
      console.log(`  🎵 File ${index + 1} URL:`, url);
      console.log(`  🔍 Has token:`, url.includes("token="));
    });

    // 3️⃣ Use the correct user ID from users table, not auth user.id
    submissionData.userid = userId;

    // 4️⃣ Insert submission into table
    const { data: submission, error: insertError } = await supabase
      .from("submissions")
      .insert([
        {
          ...submissionData, // title, genre, bpm, key, description
          files: fileUrls,
        },
      ])
      .select();

    if (insertError) throw insertError;

    console.log("✅ Submission created successfully:", submission[0]);
    return submission[0]; // return created submission
  } catch (error) {
    console.error("Error creating submission:", error);
    throw error;
  }
}

// Get all submissions of current user
export async function getSubmissions() {
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError) throw authError;
  if (!user) throw new Error("No authenticated user");

  // Get the user record ID from users table
  const userId = await getUserRecordId();

  // First get all submissions
  const { data: submissions, error: submissionsError } = await supabase
    .from("submissions")
    .select("*");

  if (submissionsError) {
    console.error("Submissions error:", submissionsError);
    throw submissionsError;
  }

  // Then get all users
  const { data: users, error: usersError } = await supabase
    .from("users")
    .select("id, name");

  if (usersError) {
    console.error("Users error:", usersError);
    throw usersError;
  }

  // Manually join the data
  const data = submissions?.map((submission) => ({
    ...submission,
    users: users?.find((user) => user.id === submission.userid) || null,
  }));

  console.log("API response data:", data);
  return data;
}

// Get a single submission by ID (must belong to user)
export async function getSubmissionById(id: string) {
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError) throw authError;
  if (!user) throw new Error("No authenticated user");

  // Get the user record ID from users table
  const userId = await getUserRecordId();

  const { data, error } = await supabase
    .from("submissions")
    .select("*")
    .eq("id", id)
    .eq("userid", userId)
    .single();

  if (error) throw error;
  return data;
}

// Update submission (only if it belongs to the user)
export async function updateSubmission(id: string, updates: any) {
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError) throw authError;
  if (!user) throw new Error("No authenticated user");

  // Get the user record ID from users table
  const userId = await getUserRecordId();

  const { data, error } = await supabase
    .from("submissions")
    .update(updates)
    .eq("id", id)
    .eq("userid", userId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

// Update submission (admin version - no user ownership check)
export async function updateSubmissionAdmin(id: string, updates: any) {
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError) throw authError;
  if (!user) throw new Error("No authenticated user");

  const { data, error } = await supabase
    .from("submissions")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return data;
}
