document.addEventListener('DOMContentLoaded', () => {
    console.log('JS Script works.');
    const mainNav = document.querySelector('.main-nav')
    const mobileNav = document.querySelector('.mobile-nav')
    const hamburger = document.querySelector('.hamburger')

    hamburger.addEventListener('click', () => {
        hamburger.classList.toggle('open')
        mobileNav.classList.toggle('active')

        if (hamburger.classList.contains('open')) {
            hamburger.innerHTML = '<i class="fa-solid fa-xmark"></i>'
        } else {
            hamburger.innerHTML = '<i class="fa-sharp fa-solid fa-bars"></i>'
        }
    })

    const genreOptionsDiv = document.querySelector('.genre-options-div')
    const genresTypeChoiceBtns = document.querySelectorAll('.genres-type-choice')
    const specificGenresBtn = document.querySelector('#specific-genres-choice')

    const showGenreOptionsDiv = () => {
        if(specificGenresBtn.checked) {
            genreOptionsDiv.classList.add('active')
        } else {
            genreOptionsDiv.classList.remove('active')
        }
    }

    for (let btn of genresTypeChoiceBtns) {
        btn.addEventListener('change', showGenreOptionsDiv)
    }

    

})