// Gérer l'affichage et la fermeture des menus déroulants pour les filtres
document.querySelectorAll(".filter-container").forEach(filter => {
    // Ouvrir/fermer le filtre au clic sur le header seulement
    filter.querySelector(".filter-header").addEventListener("click", function (event) {
        // Fermer les autres filtres avant d'ouvrir le courant
        document.querySelectorAll(".filter-container").forEach(otherFilter => {
            if (otherFilter !== filter) {
                otherFilter.classList.remove("active");
            }
        });

        // Ouvrir/fermer le filtre sélectionné
        filter.classList.toggle("active");
        event.stopPropagation(); // Empêcher la propagation pour éviter la fermeture instantanée
    });
});

// Fermer les menus déroulants lorsqu'on clique à l'extérieur
document.addEventListener("click", function (event) {
    document.querySelectorAll(".filter-container").forEach(filter => {
        if (!filter.contains(event.target)) {
            filter.classList.remove("active");
        }
    });
});

// Fonction de basculement pour tout sélectionner ou désélectionner
document.querySelectorAll(".toggle-select").forEach(button => {
    button.addEventListener("click", function(event) {
        event.stopPropagation();

        const targetId = this.getAttribute("data-target");
        const checkboxes = document.querySelectorAll(`#${targetId} input[type="checkbox"]`);
        const allChecked = Array.from(checkboxes).every(checkbox => checkbox.checked);

        // Basculer l'état de sélection pour tous les éléments et déclencher un événement de changement
        checkboxes.forEach(checkbox => {
            checkbox.checked = !allChecked;
            checkbox.dispatchEvent(new Event("change")); // Déclencher manuellement l'événement 'change'
        });

        // Mettre à jour le texte du bouton
        this.textContent = allChecked ? "Tout sélectionner" : "Tout désélectionner";
    });
});
