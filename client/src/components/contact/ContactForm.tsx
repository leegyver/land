import { useState } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { insertInquirySchema } from "@shared/schema";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { useEffect } from "react";

interface ContactFormProps {
  propertyId?: number;
  atclNo?: string;
  propertyTitle?: string;
}

const formSchema = insertInquirySchema.extend({
  agreeToTerms: z.boolean().refine(val => val === true, {
    message: "개인정보 수집 및 이용에 동의해야 합니다."
  })
});

type FormValues = z.infer<typeof formSchema>;

const ContactForm = ({ propertyId, atclNo, propertyTitle }: ContactFormProps) => {
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Construct default message for crawled properties
  const defaultMessage = atclNo && propertyTitle
    ? `[네이버 매물 문의]\n- 매물번호: ${atclNo}\n- 매물명: ${propertyTitle}\n\n문의 내용: `
    : "";

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      message: defaultMessage,
      inquiryType: "매물 구매 문의",
      propertyId: propertyId,
      agreeToTerms: false
    },
  });

  // Auto-fill form if user is logged in
  useEffect(() => {
    if (user) {
      if (user.username) form.setValue("name", user.username);
      if (user.email) form.setValue("email", user.email);
      if (user.phone) form.setValue("phone", user.phone);
    }
  }, [user, form]);

  const mutation = useMutation({
    mutationFn: (values: Omit<FormValues, "agreeToTerms">) => {
      return apiRequest("POST", "/api/inquiries", values);
    },
    onSuccess: async () => {
      toast({
        title: "문의가 성공적으로 접수되었습니다",
        description: "빠른 시일 내에 연락드리겠습니다.",
      });
      form.reset();
    },
    onError: (error) => {
      toast({
        title: "문의 접수 실패",
        description: "문의 접수 중 오류가 발생했습니다. 다시 시도해주세요.",
        variant: "destructive",
      });
      console.error("Form submission error:", error);
    }
  });

  const onSubmit = (data: FormValues) => {
    setIsSubmitting(true);

    // Remove agreeToTerms as it's not part of the inquiry schema
    const { agreeToTerms, ...inquiryData } = data;

    mutation.mutate(inquiryData);
    setIsSubmitting(false);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>이름 *</FormLabel>
                <FormControl>
                  <Input placeholder="이름을 입력하세요" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="phone"
            render={({ field }) => (
              <FormItem>
                <FormLabel>연락처 *</FormLabel>
                <FormControl>
                  <Input placeholder="연락처를 입력하세요" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>이메일 *</FormLabel>
              <FormControl>
                <Input placeholder="이메일을 입력하세요" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="inquiryType"
          render={({ field }) => (
            <FormItem>
              <FormLabel>문의 유형</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="문의 유형을 선택하세요" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="매물 구매 문의">매물 구매 문의</SelectItem>
                  <SelectItem value="매물 판매 문의">매물 판매 문의</SelectItem>
                  <SelectItem value="임대 문의">임대 문의</SelectItem>
                  <SelectItem value="기타 문의">기타 문의</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="message"
          render={({ field }) => (
            <FormItem>
              <FormLabel>문의 내용 *</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="문의 내용을 자세히 입력해 주세요"
                  rows={5}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="agreeToTerms"
          render={({ field }) => (
            <FormItem className="flex flex-row items-start space-x-3 space-y-0">
              <FormControl>
                <Checkbox
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
              <div className="space-y-1 leading-none">
                <FormLabel>
                  개인정보 수집 및 이용에 동의합니다. 수집된 정보는 문의 답변 목적으로만 사용됩니다.
                </FormLabel>
                <FormMessage />
              </div>
            </FormItem>
          )}
        />

        <Button
          type="submit"
          className="w-full btn-primary-cta h-12 text-lg"
          disabled={isSubmitting}
        >
          {isSubmitting ? "제출 중..." : "지금 상담 신청하기"}
        </Button>
      </form>
    </Form>
  );
};

export default ContactForm;
