document.addEventListener('DOMContentLoaded', () => {
    console.log('JS Script works.');

    //Hamburger menu behavior
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

    // Update the position at which Nominations table sticks to bottom of dynamic height header
    const makeTheadTrStickToBottomOfHeader = () => {
        const header = document.querySelector('header')
        const headerHeight = header.offsetHeight

        const tableTheadTrs = document.querySelectorAll('#nominations-list thead tr, .screenings-table thead tr');

        tableTheadTrs.forEach( el => {
            el.style.top = headerHeight + 'px'
        })
    }

    window.addEventListener('resize', makeTheadTrStickToBottomOfHeader)


    //Show/Hide Specific Genres Div
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

    //Activate target Filters when clicking on select fields
    const onlyNominatedByBtn = document.getElementById('only-nominatedBy')
    const nominatorsSelEl = document.getElementById('nominator-select')
    nominatorsSelEl.addEventListener('change', () => {
        console.log('select el clicked');
        onlyNominatedByBtn.checked = true
    })

    const onlyOrigNominatedByBtn = document.getElementById('only-origNomBy')
    const origNominatorsSelEl = document.getElementById('orig-nominator')
    origNominatorsSelEl.addEventListener('change', () => {
        console.log('orig-nominator selected');
        onlyOrigNominatedByBtn.checked = true 
    })

    const includesActorBtn = document.getElementById('includes-actor')
    const includesActorSelEl = document.getElementById('actor')
    includesActorSelEl.addEventListener('change', () => {
        console.log('includes-actor selected');
        includesActorBtn.checked = true 
    })

})