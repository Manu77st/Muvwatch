 // Modal de película
        function openMovieModal(movieId) {
            const modal = document.getElementById('movieModal');
            const movieData = getMovieData(movieId);

            document.getElementById('modalMovieImage').src = movieData.image;
            document.getElementById('modalMovieTitle').textContent = movieData.title;
            document.getElementById('modalOriginalName').textContent = movieData.originalName;
            document.getElementById('modalClassification').textContent = movieData.classification;
            document.getElementById('modalCast').textContent = movieData.cast;
            document.getElementById('modalDirector').textContent = movieData.director;
            document.getElementById('modalSynopsis').textContent = movieData.synopsis;

            modal.style.display = 'block';
        }
        function closeMovieModal() {
            document.getElementById('movieModal').style.display = 'none';
        }
        function getMovieData(movieId) {
            const movies = {
                'mission-impossible': {
                    image: 'https://via.placeholder.com/200x300/000000/FFFFFF?text=Mission+Impossible',
                    title: 'Mission Impossible',
                    originalName: 'Mission: Impossible',
                    classification: 'PG-13',
                    cast: 'Tom Cruise, Jon Voight, Emmanuelle Béart, Henry Czerny, Jean Reno, Ving Rhames',
                    director: 'Brian De Palma',
                    synopsis: 'Ethan Hunt es un agente de la Fuerza de Tareas de Imposibles (IMF) que se ve obligado a aceptar una misión para limpiar su nombre después de ser acusado de traición. Debe recuperar una lista secreta de agentes encubiertos que ha sido robada por un traidor dentro de la IMF.'
                },
                'spiderman': {
                    image: 'https://via.placeholder.com/200x300/FF0000/FFFFFF?text=Spider-Man',
                    title: 'Spiderman',
                    originalName: 'Spider-Man: Across the Spider-Verse',
                    classification: 'PG-13',
                    cast: 'Shameik Moore, Hailee Steinfeld, Oscar Isaac, Jake Johnson',
                    director: 'Joaquim Dos Santos, Kemp Powers, Justin K. Thompson',
                    synopsis: 'Miles Morales regresa para una nueva aventura épica que transportará al amigable vecino de Brooklyn a través del Multiverso para unir fuerzas con Gwen Stacy y un nuevo equipo de Spider-People.'
                },
                'inside-out-2': {
                    image: 'https://via.placeholder.com/200x300/FF69B4/FFFFFF?text=Inside+Out+2',
                    title: 'Inside Out 2',
                    originalName: 'Inside Out 2',
                    classification: 'PG',
                    cast: 'Amy Poehler, Phyllis Smith, Lewis Black, Tony Hale',
                    director: 'Kelsey Mann',
                    synopsis: 'Riley, ahora una adolescente, debe navegar por una nueva emoción: Ansiedad. Joy, Tristeza, Ira, Miedo y Asco deben ayudar a Riley a adaptarse a los cambios de la adolescencia.'
                },
                'beetlejuice': {
                    image: 'https://via.placeholder.com/200x300/800080/FFFFFF?text=Beetlejuice',
                    title: 'Beetlejuice',
                    originalName: 'Beetlejuice 2',
                    classification: 'PG-13',
                    cast: 'Michael Keaton, Winona Ryder, Catherine O\'Hara, Jenna Ortega',
                    director: 'Tim Burton',
                    synopsis: 'La secuela de la película clásica de 1988 sigue a Lydia Deetz y su familia cuando regresan a Winter River, donde se encuentran con Beetlejuice una vez más.'
                },
                'paddington': {
                    image: 'https://via.placeholder.com/200x300/FFA500/FFFFFF?text=Paddington',
                    title: 'Paddington',
                    originalName: 'PADDINGTON AVENTURA EN LA SELVA',
                    classification: 'PG',
                    cast: 'Ben Whishaw, Hugh Grant, Madeleine Harris, Samuel Joslin',
                    director: 'Paul King',
                    synopsis: 'Paddington se embarca en una aventura épica en la selva peruana para encontrar su verdadero hogar, mientras el Sr. Brown y su familia lo siguen en una misión de rescate.'
                }
            };
            return movies[movieId] || movies['mission-impossible'];
        }
        // Cerrar modal al hacer clic fuera de él
        window.onclick = function(event) {
            const modal = document.getElementById('movieModal');
            if (event.target == modal) {
                modal.style.display = 'none';
            }
        }

        // Menú cliente desplegable
        const clienteBox = document.getElementById('clienteBox');
        const menuCliente = document.getElementById('menuCliente');
        clienteBox.onclick = function(e) {
            e.stopPropagation();
            menuCliente.style.display = menuCliente.style.display === 'block' ? 'none' : 'block';
        };
        document.body.addEventListener('click', function() {
            menuCliente.style.display = 'none';
        });

        // Chatbot
        const chatbotBtn = document.getElementById('chatbotBtn');
        const chatbotWindow = document.getElementById('chatbotWindow');
        const chatbotClose = document.getElementById('chatbotClose');
        chatbotBtn.onclick = function() {
            chatbotWindow.style.display = 'flex';
        };
        chatbotClose.onclick = function() {
            chatbotWindow.style.display = 'none';
        };