package com.asanak.proxy.security;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ServiceResult<T> {

    private int code;
    private T data;
    private String message;
    private String error;


    public static <T> ServiceResult<T> success(T data) {
        return new ServiceResult<>(ErrorsStatus.SUCCESS.getCode(),
                data,
                ErrorsStatus.SUCCESS.getMessage(),
                null);
    }


    public static <T> ServiceResult<T> fail(int code, String message, String error) {
        return new ServiceResult<>(code, null, message, error);
    }
}
