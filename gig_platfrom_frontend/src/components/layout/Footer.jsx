import React from 'react'

const Footer = () => {
  const currentYear = new Date().getFullYear()

  return (
    <footer className='bg-[#5b8ea7] text-white border-t border-[#79aec7] mt-8'>
      <div className='mx-auto flex flex-col items-center justify-center gap-2 px-4 py-4 text-sm sm:flex-row sm:px-6 lg:px-8'>
        <p className='text-center '>
          © {currentYear} GigWork. All rights reserved.
        </p>

        <a
          href='https://api.gig-work.me/admin/'
          title='Admin login'
          className='font-medium text-yellow-500 transition-colors hover:text-[#e6f2f7] underline-offset-4 hover:underline'
        >
          Admin Portal
        </a>
      </div>
    </footer>
  )
}

export default Footer
