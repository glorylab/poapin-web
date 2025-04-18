import React, { forwardRef, useEffect, useState } from "react";
import { Spinner, useInput } from "@heroui/react";
import { PoapIcon, CloseFilledIcon } from "../shared/common-icons";
import { useNavigate, useNavigation } from "@remix-run/react";

const styles = {
    label: "text-black/50",
    mainWrapper: [
    ],
    input: [
        "bg-transparent",
        "placeholder:text-background-700/50",
        "text-xl",
        "autofill:!text-background-500",
        "autofill:!shadow-[inset_0_0_0px_1000px_transparent]",
        "autofill:!bg-transparent",
        "group-data-[has-value=true]:text-background-500",
        "auto",
        "[&::-webkit-search-cancel-button]:hidden",
    ],
    innerWrapper: [
        "bg-transparent",
        "text-background",
    ],
    inputWrapper: [
        "h-12 md:h-16 max-w-md lg:max-w-lg",
        "shadow-none",
        "rounded-t-lg rounded-b-sm md:rounded-full",
        "hover:bg-background-100",
        "focus-within:!bg-background-100",
        "active:bg-background-50",
        "group-data-[has-value=true]:shadow-none",
        "!cursor-text",
    ],
    clearButton: [
        "hover:py-1",
        "flex flex-col justify-center items-center",
        "rounded-full",
        "hover:scale-110",
        "focus:text-background-700",
        "active:text-background-700",
        "group-data-[has-value=true]:text-background-500",
    ],
};

type Props = { placeholder?: string; isClearable?: boolean; description?: string };


const AddressInputComponent = forwardRef<HTMLInputElement, Props>((props, ref) => {

    const transition = useNavigation();
    const isNavigating = transition.state === "loading";
    const [isLoading, setIsLoading] = useState(false);
    const [, setHasError] = useState(false);
    const navigate = useNavigate();
    const [isClearable, setIsClearable] = useState(props.isClearable || false);

    const handleKeyPress = async (event: React.KeyboardEvent<HTMLInputElement>) => {
        console.log("event.key", event.key);
        if (event.key === "Enter") {
            setIsLoading(true);
            setHasError(false);
            const inputValue = event.currentTarget.value;

            try {
                await navigate(`/v/${inputValue}`);
            } catch (error) {
                setHasError(true);
            } finally {
                setIsLoading(false);
            }
        }
    };


    useEffect(() => {
        console.log("isNavigating", isNavigating);
        console.log("navigate", navigate);
    }, [isNavigating, navigate]);

    const {
        Component,
        label,
        domRef,
        description,
        // isClearable,
        startContent,
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
        disabled: isLoading || isNavigating,
        onKeyDown: handleKeyPress,
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
        onChange: (event) => {
            console.log("event.target.value", event.target);
        },
    });

    useEffect(() => {
        setIsClearable(inputProps.value.length > 0);
    }
        , [inputProps.value]);

    const endContentCustom = React.useMemo(() => {
        if (isNavigating) {
            return <Spinner color="secondary" />;
        } else if (isClearable) {
            return (
                <span {...getClearButtonProps()}>{
                    <CloseFilledIcon
                        className=""
                        onClick={(event) => {
                            event.stopPropagation();
                            if (inputProps !== undefined && inputProps.onChange !== undefined) {
                                inputProps.onChange({ target: { value: "" } } as any);
                                setTimeout(() => {
                                    domRef.current?.blur();
                                }, 0);
                            }
                        }}
                    />}
                </span>
            );
        } else
            if (isLoading) {
                return <span>isLoading</span>
            } else {
                return <span>👀</span>;
            }
    }, [isClearable, isLoading, isNavigating, getClearButtonProps, inputProps, domRef]);

    const labelContent = <label {...getLabelProps()}>{label}</label>;

    const innerWrapper = React.useMemo(() => {
        if (startContent) {
            return (
                <div {...getInnerWrapperProps()}>
                    {startContent}
                    <input {...getInputProps()} />
                    {endContentCustom}

                </div>
            );
        }

        return <input {...getInputProps()} />;
    }, [startContent, getInputProps, getInnerWrapperProps, endContentCustom]);

    return (
        <div className={`
            z-100 max-w-md lg:max-w-lg lg:w-full md:w-full  lg:min-w-[400px]
            px-1 py-1 
            rounded-b-md rounded-t-lg md:rounded-full 
            flex justify-start items-start 
            bg-gradient-to-b from-secondary-300 to-secondary-500 
            text-background 
            ${isNavigating ? 'shadow-sm scale-[90%]' : 'shadow-2xl hover:shadow-md hover:scale-[99%]'}
            transition-all duration-300
        `}>
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