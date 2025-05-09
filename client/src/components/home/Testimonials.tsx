import { useQuery } from "@tanstack/react-query";
import { Testimonial } from "@shared/schema";
import { Skeleton } from "@/components/ui/skeleton";

const Testimonials = () => {
  const { data: testimonials, isLoading, error } = useQuery<Testimonial[]>({
    queryKey: ["/api/testimonials"],
  });

  if (isLoading) {
    return (
      <section className="py-16 bg-primary/5">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">고객 후기</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[...Array(3)].map((_, index) => (
              <div key={index} className="bg-white p-8 rounded-lg shadow-md relative">
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-4 w-3/4 mb-6" />
                <div className="flex items-center">
                  <Skeleton className="w-12 h-12 rounded-full mr-4" />
                  <div>
                    <Skeleton className="h-4 w-24 mb-1" />
                    <Skeleton className="h-3 w-32" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="py-16 bg-primary/5">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">고객 후기</h2>
          <div className="bg-red-50 p-4 rounded-md text-red-500">
            고객 후기를 불러오는 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-16 bg-primary/5">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl font-bold text-center mb-12">고객 후기</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {testimonials && testimonials.map((testimonial) => (
            <div key={testimonial.id} className="bg-white p-8 rounded-lg shadow-md relative">
              <div className="text-primary text-5xl absolute -top-4 left-6 opacity-20">
                <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M9.75 9.75C9.75 8.09 8.41 6.75 6.75 6.75H4.5C3.67 6.75 3 7.42 3 8.25V9.75C3 10.58 3.67 11.25 4.5 11.25H6.75C7.16 11.25 7.5 11.59 7.5 12V14.25C7.5 14.66 7.16 15 6.75 15H5.25C4.84 15 4.5 14.66 4.5 14.25V12.75H3V14.25C3 15.5 4 16.5 5.25 16.5H6.75C8 16.5 9 15.5 9 14.25V12C9 11.17 8.33 10.5 7.5 10.5H5.25C4.84 10.5 4.5 10.16 4.5 9.75V8.25C4.5 7.84 4.84 7.5 5.25 7.5H6.75C7.58 7.5 8.25 8.17 8.25 9H9.75V9.75ZM21 9.75C21 8.09 19.66 6.75 18 6.75H15.75C14.92 6.75 14.25 7.42 14.25 8.25V9.75C14.25 10.58 14.92 11.25 15.75 11.25H18C18.41 11.25 18.75 11.59 18.75 12V14.25C18.75 14.66 18.41 15 18 15H16.5C16.09 15 15.75 14.66 15.75 14.25V12.75H14.25V14.25C14.25 15.5 15.25 16.5 16.5 16.5H18C19.25 16.5 20.25 15.5 20.25 14.25V12C20.25 11.17 19.58 10.5 18.75 10.5H16.5C16.09 10.5 15.75 10.16 15.75 9.75V8.25C15.75 7.84 16.09 7.5 16.5 7.5H18C18.83 7.5 19.5 8.17 19.5 9H21V9.75Z"/>
                </svg>
              </div>
              <p className="text-gray-medium mb-6 relative z-10">{testimonial.message}</p>
              <div className="flex items-center">
                <div className="w-12 h-12 bg-gray-light rounded-full flex items-center justify-center mr-4">
                  <span className="text-primary font-bold">{testimonial.name.charAt(0)}</span>
                </div>
                <div>
                  <h4 className="font-bold">{testimonial.name}</h4>
                  <p className="text-sm text-gray-medium">{testimonial.description}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Testimonials;
