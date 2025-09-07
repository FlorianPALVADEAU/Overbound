/* eslint-disable @next/next/no-img-element */
import React from 'react'
import Headings from '../globals/Headings'

const RallyingSlur = () => {
  return (
    <div className="w-full h-48 md:h-64 lg:h-74 xl:h-98 relative flex items-center justify-center overflow-hidden mt-16 sm:mt-20 lg:mt-24">
      
      {/* Background Image */}
      <img 
        src="https://images.unsplash.com/photo-1501554728187-ce583db33af7?q=80&w=687&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D" 
        alt="Ralliement Overbound"
        className="absolute inset-0 object-cover w-full h-full"
      />
      
      {/* Gradient Overlay pour améliorer la lisibilité */}
      <div className="absolute inset-0 bg-gradient-to-r from-white/90 via-white/60 to-transparent" />
      
      {/* Content Container */}
      <div className="relative z-10 w-full h-full px-4 sm:px-6 md:px-8 lg:px-16 xl:px-32 flex items-center">
        <div className="w-full md:w-4/5 lg:w-3/4 xl:w-3/5">
          <Headings 
            title='OKAÏOOO.... KAÏ !'
            description="Ce cri de ralliement rassemble les tribus d'Overbound."
            sx="text-left"
          />
        </div>
      </div>
    </div>
  )
}

export default RallyingSlur