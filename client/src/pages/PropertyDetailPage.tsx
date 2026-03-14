import { useParams } from "wouter";
import PropertyDetail from "@/components/property/PropertyDetail";
import NaverPropertyOverlay from "@/components/property/NaverPropertyOverlay";
import { Helmet } from "react-helmet";
import { useQuery } from "@tanstack/react-query";
import { Property } from "@shared/schema";

const PropertyDetailPage = () => {
  const { id } = useParams<{ id: string }>();

  const { data: property, isLoading } = useQuery<Property>({
    queryKey: [`/api/properties/${id}`],
    enabled: !!id,
  });

  // Naver Property Check
  const isNaverProperty = property?.source === 'naver' || (id && id.startsWith('naver-'));

  if (isNaverProperty && property) {
    return (
      <div className="pt-0">
        <Helmet>
          <title>매물 상세 | 이가이버 부동산</title>
          <meta name="robots" content="noindex" />
        </Helmet>
        <NaverPropertyOverlay property={property} />
      </div>
    );
  }

  return (
    <div className="pt-0"> {/* Offset removed for sticky header */}
      <Helmet>
        <title>
          {property ? `${property.title} | 이가이버 부동산` : "매물 상세 | 이가이버 부동산"}
        </title>
        <meta
          name="description"
          content={property ?
            `${property.description.substring(0, 150)}... - 이가이버 부동산에서 ${property.type} 매물을 확인하세요.` :
            "이가이버 부동산의 프리미엄 매물 상세 정보를 확인하세요. 아파트, 주택, 빌라, 오피스텔 등 다양한 매물 정보 제공."
          }
        />
        <meta property="og:title" content={property ? `${property.title} | 이가이버 부동산` : "매물 상세 | 이가이버 부동산"} />
        <meta property="og:type" content="website" />
        <meta
          property="og:description"
          content={property ?
            `${property.description.substring(0, 150)}... - 이가이버 부동산에서 ${property.type} 매물을 확인하세요.` :
            "이가이버 부동산의 프리미엄 매물 상세 정보를 확인하세요. 아파트, 주택, 빌라, 오피스텔 등 다양한 매물 정보 제공."
          }
        />
        {property && <meta property="og:image" content={
          Array.isArray(property.imageUrls) && property.imageUrls.length > 0 &&
            typeof property.featuredImageIndex === 'number'
            ? property.imageUrls[property.featuredImageIndex]
            : (property.imageUrls && property.imageUrls.length > 0
              ? property.imageUrls[0]
              : property.imageUrl)
        } />}
      </Helmet>

      <PropertyDetail propertyId={id} />
    </div>
  );
};

export default PropertyDetailPage;
