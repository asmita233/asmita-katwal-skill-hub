import React from 'react'
import { dummyTestimonial, assets } from '../../assets/assets'

const TestimonialSection = () => {
  return (
    <div className="py-14 px-8 md:px-0 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold mb-2">Testimonials</h1>
      <p className="md:text-base text-gray-600 mb-8">
        Hear from our learners as they share their journey
      </p>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {dummyTestimonial.map((testimonial, index) => (
          <div
            key={index}
            className="border rounded-xl p-5 shadow-sm hover:shadow-md transition"
          >
            {/* Name & Role */}
            <div className="mb-3">
              <h2 className="font-semibold text-lg">
                {testimonial.name}
              </h2>
              <p className="text-sm text-gray-500">
                {testimonial.role}
              </p>
            </div>

            {/* Star Rating */}
            <div className="flex gap-0.5 mb-4">
              {[...Array(5)].map((_, i) => (
                <img
                  key={i}
                  className="h-4"
                  src={
                    i < Math.floor(testimonial.rating)
                      ? assets.star
                      : assets.star_blank
                  }
                  alt="star"
                />
              ))}
            </div>

            {/* Feedback */}
            <p className="text-gray-600 text-sm mb-4">
              {testimonial.feedback}
            </p>

            {/* Read More */}
            <a
              href="#"
              className="text-blue-500 underline text-sm"
            >
              Read more
            </a>
          </div>
        ))}
      </div>
    </div>
  )
}

export default TestimonialSection
