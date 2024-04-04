import React, { forwardRef, useState } from "react";
import { Spinner, useInput } from "@nextui-org/react";
import { CloseFilledIcon, PoapIcon } from "../shared/common-icons";
import { useNavigate } from "@remix-run/react";

const styles = {
    label: "text-black/50",
    mainWrapper: [
        "bg-background-200/50",
        "backdrop-blur-xl",
        "backdrop-saturate-200",
        "hover:bg-background-200/70",
        "focus-within:!bg-background-200/50",
    ],
    input: [
        "bg-transparent",
        "text-background",
        "placeholder:text-background-700/50",
        "text-xl",
        "group-data-[has-value=true]:text-background-900",
    ],
    innerWrapper: [
        "bg-transparent",
    ],
    inputWrapper: [
        "h-20 max-w-md",
        "shadow-none",
        "rounded-3xl",
        "bg-background-200",
        "backdrop-blur-xl",
        "backdrop-saturate-200",
        "hover:bg-background-100",
        "focus-within:!bg-background-100",
        "active:bg-background-50",
        "group-data-[has-value=true]:shadow-none",
        "!cursor-text",
    ],
};

type Props = { placeholder?: string; isClearable?: boolean; description?: string };


const AddressInputComponent = forwardRef<HTMLInputElement, Props>((props, ref) => {

    const [isLoading, setIsLoading] = useState(false);
    const [hasError, setHasError] = useState(false);
    const navigate = useNavigate();

    const handleKeyPress = async (event: React.KeyboardEvent<HTMLInputElement>) => {
        if (event.key === "Enter") {
            setIsLoading(true);
            setHasError(false);
            const inputValue = event.currentTarget.value;

            try {
                await navigate(`/v/${inputValue}`);
            } catch (error) {
                setHasError(true);
                setIsLoading(false);
            } finally {
                setIsLoading(false);
            }
        }
    };

    const {
        Component,
        label,
        domRef,
        description,
        isClearable,
        startContent,
        endContent,
        shouldLabelBeOutside,
        shouldLabelBeInside,
        errorMessage,
        getBaseProps,
        getLabelProps,
        getInputProps,
        getInnerWrapperProps,
        getInputWrapperProps,
        getDescriptionProps,
        getErrorMessageProps,
        getClearButtonProps,
    } = useInput({
        ...props,
        ref,
        disabled: isLoading,
        type: "search",
        placeholder: `${props.placeholder || "Search for an address"}`,
        startContent: (
            <PoapIcon className=" w-12 h-12 text-black/50 mb-0.5 dark:text-white/90 text-slate-400 pointer-events-none flex-shrink-0" />
        ),
        classNames: {
            ...styles,
        },
    });

    const inputProps = getInputProps({
        onKeyDown: handleKeyPress,
    });

    const endContentCustom = isLoading ? (
        <Spinner color="secondary" />
    ) : isClearable && !isLoading && !hasError ? (
        <span {...getClearButtonProps()}>{<CloseFilledIcon />}</span>
    ) : null;
    

    const labelContent = <label {...getLabelProps()}>{label}</label>;

    const end = React.useMemo(() => {
        if (isClearable) {
            return <span {...getClearButtonProps()}>{endContent || <CloseFilledIcon />}</span>;
        }

        return endContent;
    }, [isClearable, endContent, getClearButtonProps]);

    const innerWrapper = React.useMemo(() => {
        if (startContent || end) {
            return (
                <div {...getInnerWrapperProps()}>
                    {startContent}
                    <input {...inputProps} />
                    {endContentCustom}
                    {end}
                </div>
            );
        }

        return <input {...getInputProps()} />;
    }, [startContent, end, getInputProps, getInnerWrapperProps, inputProps, endContentCustom]);



    return (
        <div className={`w-full h-full px-1 py-1 rounded-b-3xl rounded-t-3xl flex justify-start items-start bg-gradient-to-b from-secondary-300 to-secondary-500 text-background shadow-2xl transition-all duration-300 hover:shadow-md hover:scale-[99%]`}>
            <Component {...getBaseProps()}>
                {shouldLabelBeOutside ? labelContent : null}
                <div
                    {...getInputWrapperProps()}
                    role="button"
                    tabIndex={0} // to make the div focusable
                    onClick={() => {
                        domRef.current?.focus();
                    }}
                    onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                            domRef.current?.focus();
                        }
                    }}
                >
                    {shouldLabelBeInside ? labelContent : null}
                    {innerWrapper}
                </div>
                {description && <div {...getDescriptionProps()}>{description}</div>}
                {errorMessage && <div {...getErrorMessageProps()}>{errorMessage}</div>}
            </Component>
        </div>
    );
});

AddressInputComponent.displayName = "AddressInputComponent";

export default AddressInputComponent;