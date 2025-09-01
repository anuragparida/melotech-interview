// getUser.js
import supabase from "../supabase";

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

export async function updateUser(updates) {
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

export async function createSubmission(submissionData, files) {
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError) throw authError;
  if (!user) throw new Error("No authenticated user");

  try {
    // 2️⃣ Upload files asynchronously
    const uploadPromises = files.map(async (file) => {
      const fileName = `${Date.now()}-${file.name}`;
      const filePath = `${user.id}/${fileName}`; // folder = user.id

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("melotechaudio") // your bucket name
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Generate public URL
      const { data } = supabase.storage
        .from("melotechaudio")
        .getPublicUrl(filePath);

      return data.publicUrl;
    });

    const fileUrls = await Promise.all(uploadPromises);

    submissionData.userid = user.id;

    // 3️⃣ Insert submission into table
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

  const { data, error } = await supabase.from("submissions").select("*");

  if (error) throw error;
  return data;
}

// Get a single submission by ID (must belong to user)
export async function getSubmissionById(id) {
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError) throw authError;
  if (!user) throw new Error("No authenticated user");

  const { data, error } = await supabase
    .from("submissions")
    .select("*")
    .eq("id", id)
    .eq("userid", user.id)
    .single();

  if (error) throw error;
  return data;
}

// Update submission (only if it belongs to the user)
export async function updateSubmission(id, updates) {
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
    .eq("userid", user.id)
    .select()
    .single();

  if (error) throw error;
  return data;
}
