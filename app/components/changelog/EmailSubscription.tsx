import { useState } from "react";
import { useFetcher } from "@remix-run/react";
import { Button, Input } from "@heroui/react";
import { Icon } from "@iconify/react";

interface FetcherData {
  error?: string;
  success?: boolean;
  message?: string;
}

interface EmailSubscriptionProps {
  showHeading?: boolean;
  headingText?: string;
  descriptionText?: string;
}

export function EmailSubscription({
  showHeading = true,
  headingText = "Stay Updated",
  descriptionText = "Get notified when we release new features and improvements.",
}: EmailSubscriptionProps) {
  const fetcher = useFetcher<FetcherData>();
  const [email, setEmail] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(false);

  const isLoading = fetcher.state === "submitting";
  const hasError = fetcher.data?.error;
  const hasSuccess = fetcher.data?.success || fetcher.data?.message;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    fetcher.submit(
      { email: email.trim() },
      { method: "post", action: "/api/newsletter/subscribe" }
    );
    setIsSubmitted(true);
  };

  // Reset form when email changes after submission
  const handleEmailChange = (value: string) => {
    setEmail(value);
    if (isSubmitted) {
      setIsSubmitted(false);
    }
  };

  if (isSubmitted && hasSuccess && !hasError) {
    return (
      <div className="mt-6 p-4 rounded-lg bg-success-50 border border-success-200">
        <div className="flex items-center gap-2 text-success-700">
          <Icon icon="heroicons:check-circle" width={20} />
          <p className="text-sm font-medium">
            {typeof fetcher.data?.message === 'string'
              ? fetcher.data.message
              : "Thank you for subscribing!"}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-6">
      {showHeading && (
        <div className="mb-3">
          <h3 className="text-sm font-medium text-white">{headingText}</h3>
          <p className="text-xs text-gray-400 mt-1">
            {descriptionText}
          </p>
        </div>
      )}

      <fetcher.Form onSubmit={handleSubmit} className="space-y-4">
        <div className="
          max-w-md w-full
          px-1 py-1 
          rounded-lg
          flex justify-start items-start 
          bg-gradient-to-b from-sky-300 to-sky-500 
          text-background 
          shadow-2xl hover:shadow-md hover:scale-[99%]
          transition-all duration-300
        ">
          <Input
            type="email"
            name="email"
            value={email}
            onValueChange={handleEmailChange}
            placeholder="Enter your email"
            startContent={<Icon icon="heroicons:envelope" width={18} className="text-background-600" />}
            isRequired
            isInvalid={!!hasError}
            errorMessage={hasError}
            classNames={{
              base: "w-full",
              mainWrapper: [
              ],
              input: [
                "bg-transparent",
                "text-background-500",
                "placeholder:text-background-700/50",
                "text-base",
                "autofill:!text-background-500",
                "autofill:!shadow-[inset_0_0_0px_1000px_transparent]",
                "autofill:!bg-transparent",
                "group-data-[has-value=true]:text-background-500",
              ],
              inputWrapper: [
                "h-10 md:h-12",
                "shadow-none",
                "rounded-lg",
                "bg-sky-50",
                "hover:bg-background-100",
                "focus-within:!bg-background-100",
                "active:bg-background-50",
                "group-data-[has-value=true]:shadow-none",
                "!cursor-text",
                "border-none",
              ],
              innerWrapper: [
                "text-background",
              ],
            }}
            size="md"
          />
        </div>

        <Button
          type="submit"
          color="primary"
          variant="solid"
          size="md"
          isLoading={isLoading}
          isDisabled={!email.trim() || isLoading}
          startContent={
            isLoading ? (
              null
            ) : (
              <Icon icon="heroicons:envelope" width={18} />
            )
          }
          className="w-full bg-gradient-to-r from-sky-500 to-sky-600 hover:from-sky-600 hover:to-sky-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 rounded-full h-10 md:h-12 max-w-xs"
        >
          {isLoading ? "Subscribing..." : "Subscribe"}
        </Button>
      </fetcher.Form>

      {hasError && (
        <div className="mt-3 p-3 rounded-lg bg-danger-50 border border-danger-200">
          <div className="flex items-center gap-2 text-danger-700">
            <Icon icon="heroicons:x-circle" width={16} />
            <p className="text-xs">
              {typeof hasError === 'string' ? hasError : "Something went wrong. Please try again."}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
