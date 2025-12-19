// Meal Modal Logic
const mealModal = document.getElementById("meal-modal");
const closeMealModal = document.getElementById("close-meal-modal");

if (closeMealModal) {
  closeMealModal.onclick = function () {
    mealModal.style.display = "none";
  };
}

async function fetchMeals() {
  if (showMode) {
    currentMeals = mockMeals;
    displayMeals(currentMeals);
    return;
  }

  try {
    const response = await authenticatedFetch(SERVER_URL + "api/v1/dishes");
    if (!response) return;
    let meals = await response.json();
    if (!Array.isArray(meals)) meals = [meals];
    currentMeals = meals;
    displayMeals(meals);
  } catch (error) {
    console.error("Error fetching meals:", error);
    const mealsList = document.getElementById("meals-list");
    if (mealsList) {
      mealsList.innerHTML =
        '<p style="color: red; text-align: center;">Error loading meals.</p>';
    }
  }
}

function displayMeals(meals) {
  const mealsList = document.getElementById("meals-list");
  if (!mealsList) return;

  mealsList.innerHTML = "";

  meals.forEach((meal) => {
    const card = document.createElement("div");
    card.className = "order-card";

    // Use placeholder if no image
    // Note: meal.Image will now always have forward slashes (e.g. "uploads/file.jpg")
    const imageSrc = meal.Image
      ? SERVER_URL + meal.Image
      : "https://via.placeholder.com/150?text=No+Image";

    const mealId = meal.DishID || meal.MealID || meal.id;
    const mealName = meal.Name || meal.name || `Dish #${mealId}`;

    card.innerHTML = `
            <div class="order-header">
                <span>#${mealId}</span>
                <span>€${parseFloat(meal.Price).toFixed(2)}</span>
            </div>
            <div class="order-details" style="display: flex; gap: 15px; align-items: center;">
                <img src="${imageSrc}" alt="${mealName}" style="width: 60px; height: 60px; object-fit: cover; border-radius: 5px;">
                <div>
                    <h3 style="margin: 0 0 5px 0;">${mealName}</h3>
                    <p style="margin: 0; color: #7f8c8d; font-size: 0.9rem;">${
                      meal.Ingredients || meal.Description || ""
                    }</p>
                </div>
            </div>
            <div class="order-actions">
                <button class="btn btn-details" onclick="openMealModal('${mealId}')">Edit</button>
                <button class="btn" style="background-color: #e74c3c; color: white;" onclick="deleteMeal('${mealId}')">Delete</button>
            </div>
        `;
    mealsList.appendChild(card);
  });
}

function openMealModal(mealId = null) {
  const title = document.getElementById("meal-modal-title");
  const form = document.getElementById("meal-form");
  const modal = document.getElementById("meal-modal");
  const imageInput = document.getElementById("meal-image");
  const preview = document.getElementById("image-preview");

  if (mealId) {
    title.textContent = "Edit Meal";
    // Use loose equality (==) to handle string/number mismatches
    const meal = currentMeals.find(
      (m) => (m.DishID || m.MealID || m.id) == mealId
    );
    if (meal) {
      document.getElementById("meal-id").value =
        meal.DishID || meal.MealID || meal.id;
      document.getElementById("meal-name").value = meal.Name || meal.name || "";
      document.getElementById("meal-price").value = meal.Price;
      document.getElementById("meal-ingredients").value =
        meal.Ingredients || meal.Description || "";

      // Image is optional when editing (keep existing)
      imageInput.required = false;

      // Show existing image in preview
      if (meal.Image) {
        preview.src = SERVER_URL + meal.Image;
        preview.style.display = "block";
      } else {
        preview.src = "";
        preview.style.display = "none";
      }
    } else {
      console.error("Meal not found for ID:", mealId);
    }
  } else {
    title.textContent = "Add New Meal";
    form.reset();
    document.getElementById("meal-id").value = "";

    // Image is required when creating new
    imageInput.required = true;

    // Clear preview
    preview.src = "";
    preview.style.display = "none";
  }

  modal.style.display = "block";
}

async function handleMealSubmit(event) {
  event.preventDefault();

  const mealId = document.getElementById("meal-id").value;
  const name = document.getElementById("meal-name").value;
  const price = document.getElementById("meal-price").value;
  const ingredients = document.getElementById("meal-ingredients").value;
  const imageInput = document.getElementById("meal-image");

  if (showMode) {
    const mealData = {
      Name: name,
      Price: parseFloat(price),
      Ingredients: ingredients,
      Image: "https://via.placeholder.com/150", // Mock image
    };

    if (mealId) {
      // Update mock
      const index = mockMeals.findIndex((m) => m.MealID == mealId);
      if (index !== -1) {
        mockMeals[index] = { ...mockMeals[index], ...mealData };
      }
    } else {
      // Add mock
      const newId = Math.max(...mockMeals.map((m) => m.MealID), 0) + 1;
      mockMeals.push({ MealID: newId, ...mealData });
    }
    fetchMeals();
    document.getElementById("meal-modal").style.display = "none";
    return;
  }

  try {
    let url = SERVER_URL + "api/v1/dishes";
    let method = "POST";

    if (mealId) {
      url += `/${mealId}`;
      method = "PUT";
    }

    // Build FormData
    const formData = new FormData();
    formData.append("Name", name);
    formData.append("Price", price);
    formData.append("Ingredients", ingredients);
    
    // Only append image if a file is selected
    if (imageInput.files && imageInput.files[0]) {
      formData.append("image", imageInput.files[0]);
    }

    const response = await authenticatedFetch(url, {
      method: method,
      body: formData,
    });

    if (!response) return;
    if (response.ok) {
      fetchMeals();
      document.getElementById("meal-modal").style.display = "none";
    } else {
      alert("Failed to save meal");
    }
  } catch (error) {
    console.error("Error saving meal:", error);
    alert("Error saving meal");
  }
}

async function deleteMeal(mealId) {
  if (!confirm("Are you sure you want to delete this meal?")) return;

  if (showMode) {
    const index = mockMeals.findIndex((m) => m.MealID === mealId);
    if (index !== -1) {
      mockMeals.splice(index, 1);
      fetchMeals();
    }
    return;
  }

  try {
    const response = await authenticatedFetch(
      SERVER_URL + `api/v1/dishes/${mealId}`,
      {
        method: "DELETE",
      }
    );

    if (!response) return;
    if (response.ok) {
      fetchMeals();
    } else {
      alert("Failed to delete meal");
    }
  } catch (error) {
    console.error("Error deleting meal:", error);
    alert("Error deleting meal");
  }
}

// Image Preview Logic
document
  .getElementById("meal-image")
  .addEventListener("change", function (event) {
    const file = event.target.files[0];
    const preview = document.getElementById("image-preview");

    if (file) {
      const reader = new FileReader();

      reader.onload = function (e) {
        preview.src = e.target.result;
        preview.style.display = "block";
      };

      reader.readAsDataURL(file);
    } else {
      preview.src = "";
      preview.style.display = "none";
    }
  });

// Make functions globally available
window.openMealModal = openMealModal;
window.handleMealSubmit = handleMealSubmit;
window.deleteMeal = deleteMeal;
